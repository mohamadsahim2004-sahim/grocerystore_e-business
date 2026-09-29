const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const MAX_ADDRESSES = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\-\s\d]+$/;

// Same rules the checkout form and POST /api/orders use for a delivery address.
const cleanText = (value) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '');

function parseAddress(body = {}, { partial = false } = {}) {
  const errors = {};
  const out = {};
  const rules = [
    ['label', 'Label', 1, 30],
    ['street', 'Address', 3, 200],
    ['city', 'City', 2, 100],
    ['postalCode', 'Postal code', 2, 12],
    ['country', 'Country', 2, 100]
  ];

  for (const [key, label, min, max] of rules) {
    if (partial && body[key] === undefined) continue;
    if (key === 'label' && (body.label === undefined || body.label === '')) {
      out.label = 'Home';
      continue;
    }
    const value = cleanText(body[key]);
    if (value.length < min || value.length > max) {
      errors[key] = `${label} must be between ${min} and ${max} characters`;
    } else {
      out[key] = value;
    }
  }

  if (!errors.postalCode && out.postalCode !== undefined && !/^[A-Za-z0-9\- ]+$/.test(out.postalCode)) {
    errors.postalCode = 'Enter a valid postal code';
  }
  return { data: out, errors };
}

const invalid = (res, errors) =>
  res.status(400).json({ message: 'Please check your address details', errors });

const makeDefault = (user, address) => {
  user.addresses.forEach((a) => {
    a.isDefault = a._id.equals(address._id);
  });
};

// Every address route only ever touches req.user's own document, so one user can never read or change another user's addresses.
const findOwnAddress = (user, id) => (mongoose.isValidObjectId(id) ? user.addresses.id(id) : null);

router.use(protect);

// @desc    Get logged-in user's profile
// @route   GET /api/profile
// @access  Private
router.get('/', (req, res) => {
  res.json({ user: req.user });
});

// @desc    Update logged-in user's profile (name, email, phone)
// @route   PUT /api/profile
// @access  Private
router.put('/', async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (trimmed.length < 2 || trimmed.length > 100) {
        return res.status(400).json({ message: 'Name must be between 2 and 100 characters' });
      }
      user.name = trimmed;
    }

    if (email !== undefined) {
      const normalized = String(email).trim().toLowerCase();
      if (!EMAIL_PATTERN.test(normalized) || normalized.length > 254) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }
      if (normalized !== user.email) {
        const taken = await User.findOne({ email: normalized, _id: { $ne: user._id } });
        if (taken) {
          return res.status(400).json({ message: 'An account with this email already exists' });
        }
        user.email = normalized;
      }
    }

    if (phone !== undefined) {
      const trimmed = String(phone).trim();
      if (trimmed && (!PHONE_PATTERN.test(trimmed) || trimmed.length > 20 || trimmed.replace(/\D/g, '').length < 7)) {
        return res.status(400).json({ message: 'Please enter a valid phone number' });
      }
      user.phone = trimmed;
    }

    const updated = await user.save();
    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
});

// @desc    List the logged-in user's saved addresses
// @route   GET /api/profile/addresses
// @access  Private
router.get('/addresses', (req, res) => {
  res.json({ addresses: req.user.addresses });
});

// @desc    Add a saved address (the first one becomes the default)
// @route   POST /api/profile/addresses
// @access  Private
router.post('/addresses', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.addresses.length >= MAX_ADDRESSES) {
      return res.status(400).json({ message: `You can save up to ${MAX_ADDRESSES} addresses` });
    }

    const { data, errors } = parseAddress(req.body);
    if (Object.keys(errors).length > 0) return invalid(res, errors);

    user.addresses.push(data);
    const created = user.addresses[user.addresses.length - 1];
    if (user.addresses.length === 1 || req.body.isDefault === true) makeDefault(user, created);

    await user.save();
    res.status(201).json({ addresses: user.addresses });
  } catch (error) {
    next(error);
  }
});

// @desc    Update a saved address
// @route   PUT /api/profile/addresses/:addressId
// @access  Private
router.put('/addresses/:addressId', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const address = findOwnAddress(user, req.params.addressId);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    const { data, errors } = parseAddress(req.body, { partial: true });
    if (Object.keys(errors).length > 0) return invalid(res, errors);

    address.set(data);
    // There must always be exactly one default, so an address can only be promoted here, not un-defaulted
    if (req.body.isDefault === true) makeDefault(user, address);

    await user.save();
    res.json({ addresses: user.addresses });
  } catch (error) {
    next(error);
  }
});

// @desc    Make a saved address the default
// @route   PATCH /api/profile/addresses/:addressId/default
// @access  Private
router.patch('/addresses/:addressId/default', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const address = findOwnAddress(user, req.params.addressId);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    makeDefault(user, address);
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete a saved address (if it was the default, the first remaining one takes over)
// @route   DELETE /api/profile/addresses/:addressId
// @access  Private
router.delete('/addresses/:addressId', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const address = findOwnAddress(user, req.params.addressId);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    const wasDefault = address.isDefault;
    user.addresses.pull({ _id: address._id });
    if (wasDefault && user.addresses.length > 0) user.addresses[0].isDefault = true;

    await user.save();
    res.json({ addresses: user.addresses });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
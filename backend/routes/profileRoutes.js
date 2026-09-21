const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

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
      if (!String(name).trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      user.name = String(name).trim();
    }

    if (email !== undefined) {
      const normalized = String(email).trim().toLowerCase();
      if (!normalized) {
        return res.status(400).json({ message: 'Email cannot be empty' });
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
      user.phone = String(phone).trim();
    }

    const updated = await user.save();
    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
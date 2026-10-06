const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

// Dummy hash for constant-time comparison when user isn't found (timing attack protection)
const DUMMY_HASH = '$2a$10$e8wYp3P9p/9N5X3F4d8E3uY5n3J9v0G7b2K1L4M5N6O7P8Q9R0S1T';

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Strict Type Validation against NoSQL injection objects
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      (phone !== undefined && phone !== null && typeof phone !== 'string')
    ) {
      return res.status(400).json({ message: 'Name, email, password and phone must be text' });
    }

    // Check required fields
    if (!name.trim() || !email.trim() || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Sanitize and trim inputs
    const trimmedName = name.trim().replace(/\s+/g, ' ');
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';

    // Validate Name Length
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({ message: 'Name must be between 2 and 100 characters' });
    }

    // Validate Email Format & Length
    if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Validate Password Bounds
    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 6 and 128 characters' });
    }

    // Validate Phone if provided
    if (trimmedPhone) {
      if (!/^[+()\-\s\d]+$/.test(trimmedPhone) || trimmedPhone.replace(/\D/g, '').length < 7) {
        return res.status(400).json({ message: 'Please provide a valid phone number' });
      }
    }

    // Check for existing user (normalized email)
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Create user with sanitized values
    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password,
      phone: trimmedPhone || undefined
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Strict Type Check (Prevents NoSQL injection operator objects like { "$gt": "" })
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password must be text' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Constant-time execution check to prevent account enumeration via timing side-channels
    if (!user || !user.isActive) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
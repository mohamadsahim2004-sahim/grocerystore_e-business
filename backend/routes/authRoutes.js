const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

/**
 * POST /api/auth/forgot-password
 * Send a password-reset link to the registered email.
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        message: 'Please enter your email address.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Always use the same public response so callers cannot easily
    // discover whether an email address has an account.
    const successMessage =
      'If an account exists for that email, a password-reset link will be sent.';

    const user = await User.findOne({
      email: normalizedEmail,
      isActive: true
    });

    if (!user) {
      return res.json({ message: successMessage });
    }

    // Create a cryptographically secure, single-use token.
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store only the SHA-256 hash in MongoDB.
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      // Do not leave a usable token in the database if email
      // delivery cannot be configured.
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return res.status(503).json({
        message: 'Password reset email is not configured.'
      });
    }

    const resetUrl =
      `${frontendUrl.replace(/\/$/, '')}/reset-password/${resetToken}`;

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Reset your Exotic Grocery Store password',
        text:
          `We received a request to reset your password.\n\n` +
          `Open this link within 15 minutes:\n${resetUrl}\n\n` +
          `If you did not request this, you can ignore this email.`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
            <h2>Reset your password</h2>
            <p>We received a request to reset your Exotic Grocery Store password.</p>
            <p>
              <a href="${resetUrl}"
                 style="display:inline-block;padding:12px 20px;
                        background:#22543d;color:white;
                        text-decoration:none;border-radius:6px">
                Reset Password
              </a>
            </p>
            <p>This link expires in 15 minutes and can only be used once.</p>
            <p>If you did not request this, ignore this email.</p>
          </div>
        `
      });
    } catch (emailError) {
      // Invalidate the token if sending the email fails.
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      console.error('Password-reset email delivery failed.');
      return res.status(503).json({
        message: 'Unable to send the reset email. Please try again later.'
      });
    }

    return res.json({ message: successMessage });
  } catch (error) {
    next(error);
  }
});


/**
 * POST /api/auth/reset-password/:token
 * Validate the reset token and save a new password.
 */
router.post('/reset-password/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: 'Invalid or expired password-reset link.'
      });
    }

    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        message: 'Password must be between 8 and 128 characters.'
      });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
      isActive: true
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired password-reset link.'
      });
    }

    // User.save() invokes the existing User model's bcrypt
    // password-hashing middleware.
    user.password = password;

    // A reset token must never be reusable.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return res.json({
      message: 'Password reset successfully. Please log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
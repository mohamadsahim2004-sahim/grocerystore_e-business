const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { HttpError, handle } = require('../utils/httpError');

const ROLES = ['customer', 'admin'];

// Merge in each user's order count and lifetime spend (non-cancelled orders)
async function withOrderStats(users) {
  const stats = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    { $group: { _id: '$user', orderCount: { $sum: 1 }, totalSpent: { $sum: '$totalPrice' } } }
  ]);
  const byUser = new Map(stats.map((s) => [String(s._id), s]));
  return users.map((u) => {
    const s = byUser.get(String(u._id));
    return { ...u.toObject(), orderCount: s?.orderCount || 0, totalSpent: s?.totalSpent || 0 };
  });
}

// @desc    List all users with order stats
// @route   GET /api/admin/users
// @access  Private/Admin
router.get(
  '/',
  handle(async (req, res) => {
    const users = await User.find({}).select('-avatar').sort({ createdAt: -1 });
    res.json(await withOrderStats(users));
  })
);

// @desc    View one user, with order stats and their most recent orders
// @route   GET /api/admin/users/:id
// @access  Private/Admin
router.get(
  '/:id',
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'User not found');
    const user = await User.findById(req.params.id).select('-avatar');
    if (!user) throw new HttpError(404, 'User not found');

    const [[withStats], recentOrders] = await Promise.all([
      withOrderStats([user]),
      Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5)
    ]);
    res.json({ ...withStats, recentOrders });
  })
);

// @desc    Update a user's role and/or active status (used by the admin Users table)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
router.put(
  '/:id',
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'User not found');
    const { role, isActive } = req.body;
    if (role === undefined && isActive === undefined) throw new HttpError(400, 'Nothing to update');
    if (role !== undefined && !ROLES.includes(role)) throw new HttpError(400, 'Invalid role');
    if (isActive !== undefined && typeof isActive !== 'boolean') throw new HttpError(400, 'isActive must be true or false');
    if (String(req.params.id) === String(req.user._id)) {
      throw new HttpError(400, 'You cannot change your own role or deactivate your own account');
    }
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, 'User not found');
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    await user.save();
    res.json(user);
  })
);

// @desc    Change a user's role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
router.put(
  '/:id/role',
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'User not found');
    const { role } = req.body;
    if (!ROLES.includes(role)) throw new HttpError(400, 'Invalid role');
    if (String(req.params.id) === String(req.user._id)) {
      throw new HttpError(400, 'You cannot change your own role');
    }

    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, 'User not found');
    user.role = role;
    await user.save();
    res.json(user);
  })
);

module.exports = router;
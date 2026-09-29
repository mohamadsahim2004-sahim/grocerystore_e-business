const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { HttpError, handle } = require('../utils/httpError');

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

// @desc    List orders (newest first), optionally filtered by status, paginated
// @route   GET /api/admin/orders?status=&page=&limit=
// @access  Private/Admin
router.get(
  '/',
  handle(async (req, res) => {
    const filter = {};
    if (req.query.status) {
      if (!STATUSES.includes(req.query.status)) throw new HttpError(400, 'Invalid status filter');
      filter.status = req.query.status;
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter)
    ]);

    res.json({ orders, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

// @desc    Update an order's status. Cancelling restores the stock that was reserved for it.
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
router.put(
  '/:id/status',
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Order not found');
    const { status } = req.body;
    if (!STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');

    const order = await Order.findById(req.params.id);
    if (!order) throw new HttpError(404, 'Order not found');
    if (order.status === 'Cancelled') {
      throw new HttpError(400, 'This order is cancelled and can no longer be updated');
    }

        if (status === 'Cancelled') {
      // Claim the cancellation atomically so two simultaneous requests can never restore the stock twice
      const cancelled = await Order.findOneAndUpdate(
        { _id: order._id, status: { $ne: 'Cancelled' } },
        { $set: { status: 'Cancelled' } },
        { new: true }
      );
      if (!cancelled) throw new HttpError(400, 'This order is cancelled and can no longer be updated');
      await Promise.all(
        cancelled.orderItems.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }))
      );
      return res.json(cancelled);
    }

    order.status = status;
    await order.save();
    res.json(order);
  })
);

module.exports = router;
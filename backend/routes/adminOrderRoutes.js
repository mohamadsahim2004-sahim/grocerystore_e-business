const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order');
const { HttpError, handle } = require('../utils/httpError');
const { cancelOrder } = require('../utils/orderCancellation');

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

// Valid forward status transition map (State Machine)
const ALLOWED_TRANSITIONS = {
  Pending: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
  Processing: ['Shipped', 'Delivered', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [], // Terminal state
  Cancelled: []  // Terminal state
};

// @desc    List orders (newest first), optionally filtered by status, paginated
// @route   GET /api/admin/orders?status=&page=&limit=
// @access  Private/Admin
router.get(
  '/',
  handle(async (req, res) => {
    const filter = {};
    if (req.query.status) {
      if (!STATUSES.includes(req.query.status)) {
        throw new HttpError(400, 'Invalid status filter');
      }
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

    res.json({
      orders,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// @desc    Update an order's status.
//          Cancelling restores reserved stock via cancelOrder helper.
//          Every write uses optimistic concurrency control based on valid origin statuses.
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
router.put(
  '/:id/status',
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new HttpError(404, 'Order not found');
    }

    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      throw new HttpError(400, 'Invalid status');
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    const fetchPopulatedOrder = async () =>
      Order.findById(order._id).populate('user', 'name email');

    // Idempotent exit if status is unchanged
    if (order.status === status) {
      return res.json(await fetchPopulatedOrder());
    }

    // Validate forward transition path
    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      throw new HttpError(
        409,
        `Cannot transition order status from '${order.status}' to '${status}'`,
        { currentStatus: order.status }
      );
    }

    // Determine legitimate origin statuses for the requested target
    const validFromStatuses = STATUSES.filter((st) =>
      (ALLOWED_TRANSITIONS[st] || []).includes(status)
    );

    // Delegate cancellation flow to dedicated atomic handler
    if (status === 'Cancelled') {
      const result = await cancelOrder({
        orderId: order._id,
        allowedStatuses: validFromStatuses,
        cancelledBy: 'admin'
      });

      if (result.order || result.reason === 'already_cancelled') {
        return res.json(await fetchPopulatedOrder());
      }
      if (result.reason === 'not_found') {
        throw new HttpError(404, 'Order not found');
      }

      throw new HttpError(
        409,
        `This order is now '${result.status}' and can no longer be cancelled`,
        { currentStatus: result.status }
      );
    }

    // Construct update operations for standard status updates
    const updateSet = { status };
    if (status === 'Delivered') {
      updateSet.isDelivered = true;
      updateSet.deliveredAt = new Date();
    }

    // Conditional atomic update to prevent write drift/race conditions
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: { $in: validFromStatuses } },
      { $set: updateSet },
      { returnDocument: 'after' }
    );

    if (!updated) {
      const latest = await Order.findById(order._id, 'status');
      throw new HttpError(
        409,
        `This order changed while you were editing it (now '${latest ? latest.status : 'unknown'}'). Please refresh and try again.`,
        { currentStatus: latest ? latest.status : undefined }
      );
    }

    res.json(await fetchPopulatedOrder());
  })
);

module.exports = router;
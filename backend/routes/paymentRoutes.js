const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { handle } = require('../utils/httpError');
const { getPayHereParams, handlePayHereNotify } = require('../controllers/paymentController');

// @route   POST /api/payments/payhere/params
// @desc    Build the PayHere Checkout form fields (incl. hash) for one of the caller's own unpaid orders
// @access  Private
router.post('/payhere/params', protect, handle(getPayHereParams));

// @route   POST /api/payments/payhere/notify
// @desc    Server-to-server payment notification from PayHere (application/x-www-form-urlencoded).
//          NO JWT: PayHere calls it directly. Authenticity comes from the md5sig check in the controller.
// @access  Public (signature verified)
router.post('/payhere/notify', handle(handlePayHereNotify));

// @route   POST /api/payments/test-success
// @desc    DEVELOPMENT ONLY: simulate a payment on localhost.
//          Never enable MOCK_PAYMENTS in production.
// @access  Private
router.post('/test-success', protect, handle(async (req, res) => {
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.MOCK_PAYMENTS !== 'true'
  ) {
    return res.status(403).json({
      message: 'Local test payments are disabled.'
    });
  }

  const { orderId } = req.body;

  if (!orderId || !/^[a-f\d]{24}\$/i.test(orderId)) {
    return res.status(400).json({ message: 'Invalid order ID.' });
  }

  const order = await require('../models/Order').findOne({
    _id: orderId,
    user: req.user._id,
    paymentMethod: 'CARD',
    isPaid: false,
    status: { $ne: 'Cancelled' }
  });

  if (!order) {
    return res.status(404).json({
      message: 'Unpaid order not found.'
    });
  }

  order.isPaid = true;
  order.paymentStatus = 'Paid';
  order.paidAt = new Date();
  order.payherePaymentId = `LOCAL-TEST-${order._id}`;

  await order.save();

  return res.json({
    success: true,
    message: 'Local test payment successful.',
    orderId: String(order._id)
  });
}));

module.exports = router;
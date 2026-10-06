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

module.exports = router;
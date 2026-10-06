const express = require('express');
const router = express.Router();
const { handle } = require('../utils/httpError');
const { listRates } = require('../utils/deliveryRates');
const { FREE_SHIPPING_ABOVE } = require('../config/shipping');

// @desc    Provinces the store delivers to, with the charge for each (used by the Checkout province selector).
//          The charge actually applied is always recalculated by the server when pricing the cart.
// @route   GET /api/delivery-rates
// @access  Public
router.get(
  '/',
  handle(async (req, res) => {
    const rates = (await listRates()).filter((r) => r.enabled);
    res.json({
      rates: rates.map((r) => ({ province: r.province, charge: r.charge })),
      freeShippingAbove: FREE_SHIPPING_ABOVE
    });
  })
);

module.exports = router;
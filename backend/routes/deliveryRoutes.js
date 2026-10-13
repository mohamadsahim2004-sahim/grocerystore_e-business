const express = require('express');
const router = express.Router();
const { handle } = require('../utils/httpError');
const { listRates } = require('../utils/deliveryRates');
const { FREE_SHIPPING_ABOVE } = require('../config/shipping');
const { provinceForCity } = require('../config/cities');


// @desc    Provinces the store currently delivers to (enabled AND with a charge saved by an admin), in official order.
//          Provinces whose charge an admin has not configured yet are not listed. The charge actually applied is
//          always recalculated by the server when pricing the cart.
// @route   GET /api/delivery-rates
// @access  Public
router.get(
  '/',
  handle(async (req, res) => {
    const rates = await listRates();
    res.json({
      rates: rates
        .filter((r) => r.enabled && r.confirmed)
        .map((r) => ({ province: r.province, charge: r.charge })),
      freeShippingAbove: FREE_SHIPPING_ABOVE
    });
  })
);

// @desc    Province for a city/town name ("" when it cannot be identified - the customer then picks one)
// @route   GET /api/delivery-rates/province?city=Kandy
// @access  Public
router.get(
  '/province',
  handle(async (req, res) => {
    const city = typeof req.query.city === 'string' ? req.query.city.slice(0, 100) : '';
    res.json({ province: provinceForCity(city) });
  })
);

module.exports = router;
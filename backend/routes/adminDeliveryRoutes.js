const express = require('express');
const router = express.Router();
const DeliveryRate = require('../models/DeliveryRate');
const { HttpError, handle } = require('../utils/httpError');
const { listRates } = require('../utils/deliveryRates');
const { PROVINCES, MAX_PROVINCE_CHARGE } = require('../config/provinces');
const { FREE_SHIPPING_ABOVE } = require('../config/shipping');

const serialize = (r) => ({
  province: r.province,
  charge: r.charge,
  enabled: r.enabled,
  confirmed: r.confirmed,
  updatedAt: r.updatedAt
});

// @desc    All provinces with their charge, status and whether the value has been confirmed by an admin
// @route   GET /api/admin/delivery-rates
// @access  Private/Admin
router.get(
  '/',
  handle(async (req, res) => {
    const rates = await listRates();
    res.json({ rates: rates.map(serialize), freeShippingAbove: FREE_SHIPPING_ABOVE });
  })
);

// @desc    Update the charge / availability of one or more provinces. All entries are validated first;
//          nothing is saved unless every entry is valid.
// @route   PUT /api/admin/delivery-rates   body: { rates: [{ province, charge, enabled }] }
// @access  Private/Admin
router.put(
  '/',
  handle(async (req, res) => {
    const input = req.body && req.body.rates;
    if (!Array.isArray(input) || input.length === 0 || input.length > PROVINCES.length) {
      throw new HttpError(400, 'Send the list of provinces to update');
    }

    const errors = {};
    const seen = new Set();
    const clean = [];
    input.forEach((entry, index) => {
      const province = entry && entry.province;
      const key = typeof province === 'string' && PROVINCES.includes(province) ? province : `row${index}`;
      if (typeof province !== 'string' || !PROVINCES.includes(province)) {
        errors[key] = 'Unknown province';
        return;
      }
      if (seen.has(province)) {
        errors[province] = 'Province listed twice';
        return;
      }
      seen.add(province);

      // Strict: a real number or a numeric string, never an object/array/boolean/empty value
      const raw = entry.charge;
      const charge = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
      if (!Number.isFinite(charge) || charge < 0) {
        errors[province] = 'Charge must be a number of 0 or more';
        return;
      }
      if (charge > MAX_PROVINCE_CHARGE) {
        errors[province] = `Charge cannot be more than ${MAX_PROVINCE_CHARGE}`;
        return;
      }
      if (Math.abs(charge * 100 - Math.round(charge * 100)) > 1e-6) {
        errors[province] = 'Charge can have at most 2 decimal places';
        return;
      }
      if (typeof entry.enabled !== 'boolean') {
        errors[province] = 'Choose whether this province is delivered to';
        return;
      }
      clean.push({ province, charge: Math.round(charge * 100) / 100, enabled: entry.enabled });
    });

    if (Object.keys(errors).length) {
      throw new HttpError(400, 'Please check the highlighted charges', { errors });
    }

    await listRates(); // make sure every province exists before updating
    await Promise.all(
      clean.map((r) =>
        DeliveryRate.updateOne(
          { province: r.province },
          { $set: { charge: r.charge, enabled: r.enabled, confirmed: true, updatedBy: req.user._id } }
        )
      )
    );

    const rates = await listRates();
    res.json({ rates: rates.map(serialize), freeShippingAbove: FREE_SHIPPING_ABOVE });
  })
);

module.exports = router;
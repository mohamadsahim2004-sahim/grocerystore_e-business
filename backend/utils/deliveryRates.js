const DeliveryRate = require('../models/DeliveryRate');
const { PROVINCES, DEFAULT_PROVINCE_CHARGE } = require('../config/provinces');

// Creates any province that has no rate yet, with the placeholder charge. Safe to call concurrently:
// $setOnInsert never overwrites a rate an admin has already saved, and `province` is unique.
async function ensureRates() {
  const existing = await DeliveryRate.find({}, 'province');
  const have = new Set(existing.map((r) => r.province));
  const missing = PROVINCES.filter((p) => !have.has(p));
  await Promise.all(
    missing.map((province) =>
      DeliveryRate.updateOne(
        { province },
        { $setOnInsert: { province, charge: DEFAULT_PROVINCE_CHARGE, enabled: true, confirmed: false } },
        { upsert: true }
      ).catch((err) => {
        if (err.code !== 11000) throw err; // another request created it first
      })
    )
  );
}

// All provinces in the official order
async function listRates() {
  await ensureRates();
  const rates = await DeliveryRate.find({});
  const byProvince = new Map(rates.map((r) => [r.province, r]));
  return PROVINCES.map((p) => byProvince.get(p)).filter(Boolean);
}

// The rate customers are charged: only a known, enabled province qualifies
async function getEnabledRate(province) {
  if (typeof province !== 'string' || !PROVINCES.includes(province)) return null;
  await ensureRates();
  const rate = await DeliveryRate.findOne({ province });
  return rate && rate.enabled ? rate : null;
}

module.exports = { ensureRates, listRates, getEnabledRate };
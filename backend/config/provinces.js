// The nine provinces of Sri Lanka. This list is the single source of truth for which province names are valid;
// the admin chooses the charge (and whether to deliver there) for each one.
const PROVINCES = [
  'Western',
  'Central',
  'Southern',
  'Northern',
  'Eastern',
  'North Western',
  'North Central',
  'Uva',
  'Sabaragamuwa'
];

// Placeholder charge (store base currency) used until an admin sets a real one. It equals the flat delivery fee
// the store charged before per-province rates existed. Rates created from it are flagged `confirmed: false`
// and the admin screen asks for them to be confirmed.
const DEFAULT_PROVINCE_CHARGE = 4.9;

// Largest charge the admin can enter (guards against typos such as an extra zero or pasted numbers)
const MAX_PROVINCE_CHARGE = 100000;

module.exports = { PROVINCES, DEFAULT_PROVINCE_CHARGE, MAX_PROVINCE_CHARGE };
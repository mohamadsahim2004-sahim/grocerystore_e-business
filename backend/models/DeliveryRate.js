const mongoose = require('mongoose');
const { PROVINCES, MAX_PROVINCE_CHARGE } = require('../config/provinces');

// One document per province. Orders copy the charge they were priced with (Order.shippingPrice), so changing a
// rate here never changes an existing order.
const deliveryRateSchema = new mongoose.Schema(
  {
    province: { type: String, required: true, unique: true, enum: PROVINCES },
    charge: { type: Number, required: true, min: 0, max: MAX_PROVINCE_CHARGE },
    enabled: { type: Boolean, default: true },
    // false = placeholder value created automatically; true once an admin has saved it
    confirmed: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryRate', deliveryRateSchema);
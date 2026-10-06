const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Cost factor 10 matches the dummy hash the login route compares against for constant-time responses.
const SALT_ROUNDS = 10;

// Saved delivery addresses (managed through /api/profile/addresses). Limits mirror the route validation.
// Mongoose gives every address its own _id, which the address routes rely on.
const addressSchema = new mongoose.Schema({
  label: { type: String, trim: true, maxlength: 30, default: 'Home' },
  street: { type: String, required: true, trim: true, maxlength: 200 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  postalCode: { type: String, required: true, trim: true, maxlength: 12 },
  country: { type: String, required: true, trim: true, maxlength: 100 },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, maxlength: 254 },
    // Never returned by default: login asks for it explicitly with .select('+password')
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    // Profile photo stored as a small data URL (size and type are validated in PUT /api/profile/avatar)
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    // Deactivated accounts cannot log in and their tokens stop working (see authMiddleware)
    isActive: { type: Boolean, default: true },
    addresses: { type: [addressSchema], default: [] },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
  },
  { timestamps: true }
);

// Hash the password whenever it is set or changed. Validation (minlength) runs before this, on the plain text.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// Requires the password to have been selected: User.findOne(...).select('+password')
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Defence in depth: the hash must never leave the server, even if a query forgets to exclude it
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
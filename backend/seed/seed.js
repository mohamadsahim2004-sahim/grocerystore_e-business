// Creates (or promotes) the first admin account using the real User model.
// Non-destructive: nothing is deleted and existing data is left untouched.
// Products/categories are seeded separately with `node seed/seedGroceries.js`.
//
// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=choose-a-password ADMIN_NAME="Store Admin" node seed/seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ Set ADMIN_EMAIL and ADMIN_PASSWORD (and optionally ADMIN_NAME) before running this script.');
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 6) {
    console.error('❌ ADMIN_PASSWORD must be at least 6 characters.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI || 'mongodb://localhost:27017/exotic_store');
    const email = ADMIN_EMAIL.trim().toLowerCase();

    const existing = await User.findOne({ email });
    if (existing) {
      existing.role = 'admin';
      existing.isActive = true;
      await existing.save();
      console.log(`✅ Existing account ${email} is now an active admin (password unchanged).`);
    } else {
      await User.create({
        name: ADMIN_NAME || 'Admin',
        email,
        password: ADMIN_PASSWORD,
        role: 'admin'
      });
      console.log(`✅ Admin account ${email} created successfully.`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Admin seeding failed:', err.message);
    process.exit(1);
  }
}

run();
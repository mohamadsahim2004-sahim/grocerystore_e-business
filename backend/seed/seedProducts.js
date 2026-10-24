// Usage (from /backend):  node seed/seedProducts.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { slugify } = require('../utils/slugify');

// EDIT ME: prices are in USD (the store converts to LKR at checkout)
const CATEGORIES = [
  { name: 'Honey & Sweeteners', description: 'Natural honey and sweeteners' }
];

const PRODUCTS = [
  {
    name: 'Organic Honey',
    category: 'Honey & Sweeteners',
    description: 'Pure organic honey.',
    shortDescription: 'Pure organic honey',
    price: 8.5,
    stock: 25,
    unit: '500g',
    origin: 'Sri Lanka',
    image: '/images/products/Organic Honey.webp',
    isFeatured: true
  }
  // add the rest of your products here
];

async function run() {
  await connectDB();

  const catIds = {};
  for (const c of CATEGORIES) {
    const slug = slugify(c.name);
    const doc = await Category.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name: c.name, slug, description: c.description, isActive: true } },
      { upsert: true, new: true }
    );
    catIds[c.name] = doc._id;
  }

  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    const { category, ...rest } = p;
    if (!catIds[category]) throw new Error(`Unknown category "${category}" for ${p.name}`);
    await Product.findOneAndUpdate(
      { slug },
      { $set: { ...rest, slug, category: catIds[category], isActive: true } },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`✅ ${p.name}`);
  }

  console.log(`Done: ${PRODUCTS.length} product(s) in the database.`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('❌ Seed failed:', e.message);
  process.exit(1);
});
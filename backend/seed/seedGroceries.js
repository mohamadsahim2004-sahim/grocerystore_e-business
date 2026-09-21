// Seeds the grocery catalog (categories + products) using the real Category / Product models.
// Safe to re-run: records are upserted by slug. Users and orders are never touched.
//   Usage:  node seed/seedGroceries.js
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

const categories = [
  { name: 'Rice & Grains', slug: 'rice-grains' },
  { name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
  { name: 'Spices & Herbs', slug: 'spices-herbs' },
  { name: 'Snacks & Sweets', slug: 'snacks-sweets' },
  { name: 'Beverages', slug: 'beverages' },
  { name: 'Household & Care', slug: 'household-care' },
  { name: 'Frozen Foods', slug: 'frozen-foods' },
  { name: 'Oils & Ghee', slug: 'oils-ghee' }
];

// image paths are served by the frontend (frontend/public/images/products)
const products = [
  { slug: 'basmati-rice-5kg', name: 'Basmati Rice 5kg', category: 'rice-grains', price: 4.99, oldPrice: 6.99, rating: 4.8, reviewCount: 125, stock: 120, unit: '5 kg', origin: 'India', description: 'Premium quality long grain basmati rice. Aromatic, flavourful and perfect for biryani, pulao and everyday meals.' },
  { slug: 'red-lentils-1kg', name: 'Red Lentils 1kg', category: 'rice-grains', price: 2.49, rating: 4.6, reviewCount: 84, stock: 200, unit: '1 kg', origin: 'Turkey', description: 'Split red lentils that cook quickly and turn creamy. Ideal for dhal, soups and stews.' },
  { slug: 'coconut-oil-1l', name: 'Coconut Oil 1L', category: 'oils-ghee', price: 6.99, oldPrice: 8.99, rating: 4.9, reviewCount: 210, stock: 90, unit: '1 L', origin: 'Sri Lanka', description: 'Pure cold-pressed coconut oil for cooking, frying and traditional recipes.' },
  { slug: 'mango-pickle-400g', name: 'Mango Pickle 400g', category: 'spices-herbs', price: 3.49, rating: 4.5, reviewCount: 61, stock: 75, unit: '400 g', origin: 'India', description: 'Tangy and spicy raw mango pickle made with traditional spices.' },
  { slug: 'masala-tea-200g', name: 'Masala Tea 200g', category: 'beverages', price: 2.99, rating: 4.7, reviewCount: 98, stock: 150, unit: '200 g', origin: 'India', description: 'Strong black tea blended with cardamom, ginger and warming spices.' },
  { slug: 'chickpeas-1kg', name: 'Chickpeas 1kg', category: 'rice-grains', price: 2.7, rating: 4.5, reviewCount: 57, stock: 180, unit: '1 kg', origin: 'Canada', description: 'Whole dried chickpeas for curries, hummus and salads.' },
  { slug: 'green-cardamom-100g', name: 'Green Cardamom 100g', category: 'spices-herbs', price: 6.49, oldPrice: 7.99, rating: 4.8, reviewCount: 73, stock: 60, unit: '100 g', origin: 'India', description: 'Fragrant whole green cardamom pods for tea, desserts and rice dishes.' },
  { slug: 'curry-powder-200g', name: 'Curry Powder 200g', category: 'spices-herbs', price: 3.99, rating: 4.6, reviewCount: 66, stock: 110, unit: '200 g', origin: 'Sri Lanka', description: 'Roasted Sri Lankan style curry powder with a deep, aromatic flavour.' },
  { slug: 'ghee-500g', name: 'Pure Ghee 500g', category: 'oils-ghee', price: 7.99, rating: 4.7, reviewCount: 92, stock: 70, unit: '500 g', origin: 'India', description: 'Traditional clarified butter with a rich, nutty taste.' },
  { slug: 'cinnamon-sticks-100g', name: 'Ceylon Cinnamon Sticks 100g', category: 'spices-herbs', price: 4.49, rating: 4.9, reviewCount: 48, stock: 85, unit: '100 g', origin: 'Sri Lanka', description: 'True Ceylon cinnamon quills with a delicate, sweet aroma.' }
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/exotic_store');
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  const categoryIds = {};
  for (const c of categories) {
    const doc = await Category.findOneAndUpdate({ slug: c.slug }, { $set: c }, { upsert: true, new: true });
    categoryIds[c.slug] = doc._id;
  }

  for (const p of products) {
    const data = {
      ...p,
      category: categoryIds[p.category],
      image: `/images/products/${p.slug}.svg`,
      shortDescription: p.description.split('.')[0],
      isFeatured: true,
      isActive: true
    };
    await Product.findOneAndUpdate({ slug: p.slug }, { $set: data }, { upsert: true });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
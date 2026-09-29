require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

console.log('🔄 Script initialized. Reading configurations...');

const categories = ['Electronics', 'Apparel', 'Home & Kitchen', 'Beauty', 'Sports', 'Books', 'Automotive', 'Toys'];

const mockProducts = [
  { name: 'Wireless Headphones', slug: 'wireless-headphones', price: 99.99, category: 'Electronics' },
  { name: 'Smart Watch', slug: 'smart-watch', price: 199.99, category: 'Electronics' },
  { name: 'Bluetooth Speaker', slug: 'bluetooth-speaker', price: 49.99, category: 'Electronics' },
  { name: 'Running Shoes', slug: 'running-shoes', price: 85.00, category: 'Apparel' },
  { name: 'Denim Jacket', slug: 'denim-jacket', price: 65.00, category: 'Apparel' },
  { name: 'Graphic T-Shirt', slug: 'graphic-t-shirt', price: 22.50, category: 'Apparel' },
  { name: 'Coffee Maker', slug: 'coffee-maker', price: 79.99, category: 'Home & Kitchen' },
  { name: 'Air Fryer', slug: 'air-fryer', price: 119.99, category: 'Home & Kitchen' },
  { name: 'Chef Knife', slug: 'chef-knife', price: 35.00, category: 'Home & Kitchen' },
  { name: 'Face Moisturizer', slug: 'face-moisturizer', price: 24.00, category: 'Beauty' },
  { name: 'Scented Candle', slug: 'scented-candle', price: 18.00, category: 'Beauty' },
  { name: 'Lip Balm Set', slug: 'lip-balm-set', price: 12.00, category: 'Beauty' },
  { name: 'Yoga Mat', slug: 'yoga-mat', price: 29.99, category: 'Sports' },
  { name: 'Water Bottle', slug: 'water-bottle', price: 19.99, category: 'Sports' },
  { name: 'Dumbbell Set', slug: 'dumbbell-set', price: 45.00, category: 'Sports' },
  { name: 'Sci-Fi Novel', slug: 'sci-fi-novel', price: 14.99, category: 'Books' },
  { name: 'Cookbook', slug: 'cookbook', price: 24.99, category: 'Books' },
  { name: 'Self-Help Book', slug: 'self-help-book', price: 15.99, category: 'Books' },
  { name: 'Car Phone Mount', slug: 'car-phone-mount', price: 15.99, category: 'Automotive' },
  { name: 'Dash Cam', slug: 'dash-cam', price: 89.99, category: 'Automotive' },
  { name: 'Building Blocks', slug: 'building-blocks', price: 34.99, category: 'Toys' },
  { name: 'Board Game', slug: 'board-game', price: 29.99, category: 'Toys' }
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI is missing from your .env file!');
      process.exit(1);
    }

    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(mongoUri, { dbName: 'exotic_grocery' });
    console.log('🌱 Connected to MongoDB successfully.');

    console.log('🧹 Purging old collections...');
    await User.deleteMany({});
    await Product.deleteMany({});

    try {
      await User.collection.dropIndexes();
    } catch (e) {
      // Ignore if index didn't exist
    }
    console.log('✨ Database collections wiped clean.');

    console.log('👤 Registering demo accounts...');
    await User.create([
      { name: 'System Admin', email: 'admin@exotic.com', password: 'Admin@12345', role: 'admin' },
      { name: 'Demo Customer', email: 'customer@exotic.com', password: 'Customer@12345', role: 'customer' }
    ]);
    console.log('✅ Demo accounts generated.');

    console.log('📦 Mapping product dataset...');
    const productsToInsert = mockProducts.map((p) => ({
      ...p,
      image: `/assets/products/${p.slug}.jpg`
    }));

    await Product.insertMany(productsToInsert);
    console.log(`✅ Successfully seeded ${productsToInsert.length} products across ${categories.length} categories.`);

    await mongoose.connection.close();
    console.log('🔌 Database connection closed cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
}

seedDatabase();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('🔄 Script initialized. Reading configurations...');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['customer', 'admin'] }
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

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
    
    console.log('⏳ Connecting to MongoDB Atlas Cluster...');
    // Force Mongoose to use 'exotic_grocery' database directly in options
    await mongoose.connect(mongoUri, { dbName: 'exotic_grocery' });
    console.log('🌱 Connected to MongoDB successfully...');

    console.log('🧹 Purging old collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    
    // Drop index to force clear cached index blocks
    try {
      await User.collection.dropIndexes();
    } catch (e) {
      // index didn't exist, ignore
    }
    console.log('✨ Database collections wiped clean.');

    console.log('🔑 Hashing secure demo passwords...');
    const hashedAdminPwd = await bcrypt.hash('Admin@12345', 10);
    const hashedCustomerPwd = await bcrypt.hash('Customer@12345', 10);

    console.log('👤 Registering system developer accounts...');
    // Catch single profile errors to prevent crashing the product seeder
    try {
      await User.create([
        { email: '[email protected]', password: hashedAdminPwd, role: 'admin' },
        { email: '[email protected]', password: hashedCustomerPwd, role: 'customer' }
      ]);
      console.log('✅ Demo accounts generated.');
    } catch (userError) {
      if (userError.code === 11000) {
        console.log('⚠️ Note: Demo users already registered in cluster. Moving to products...');
      } else {
        throw userError;
      }
    }

    console.log('📦 Mapping grocery products dataset...');
    const productsToInsert = mockProducts.map(p => ({
      ...p,
      image: `/assets/products/${p.slug}.jpg`
    }));

    await Product.insertMany(productsToInsert);
    console.log(`✅ Successfully seeded 22 products across ${categories.length} categories.`);

    await mongoose.connection.close();
    console.log('🔌 Database connection closed cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with explicit runtime error:', error);
    process.exit(1);
  }
}

seedDatabase();

const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

const sampleProducts = [
  {
    name: 'Dragon Fruit (Pitaya)',
    category: 'Exotic Fruits',
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1527325678964-54921646bc06?w=500',
    description: 'Fresh organic pink dragon fruit full of antioxidants.',
    inStock: true
  },
  {
    name: 'Japanese Matcha Green Tea',
    category: 'Beverages',
    price: 18.50,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500',
    description: 'Premium ceremonial grade matcha powder from Uji, Japan.',
    inStock: true
  },
  {
    name: 'Alfonso Mangoes (Box of 6)',
    category: 'Exotic Fruits',
    price: 24.00,
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500',
    description: 'Sweet and aromatic king of mangoes imported fresh.',
    inStock: true
  },
  {
    name: 'Saffron Threads (2g)',
    category: 'Spices & Seasoning',
    price: 15.99,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500',
    description: 'Pure Grade-A Spanish saffron threads for authentic flavor.',
    inStock: true
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});
    await Product.insertMany(sampleProducts);
    console.log('Database Seeded Successfully with Sample Grocery Items!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seedDB();
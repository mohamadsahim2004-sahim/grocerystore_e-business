require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Check required secrets on boot
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Add it to the backend .env file.');
  process.exit(1);
}

const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const supportRoutes = require('./routes/supportRoutes');

const app = express();
connectDB();

// Configurable CORS origins
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));

app.use(express.json());

// Normalize empty body to prevent crashes in Express 5
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products/:productId/reviews', reviewRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery-rates', deliveryRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
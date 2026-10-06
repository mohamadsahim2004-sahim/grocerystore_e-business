const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { handle } = require('../utils/httpError');

const adminProductRoutes = require('./adminProductRoutes');
const adminCategoryRoutes = require('./adminCategoryRoutes');
const adminOrderRoutes = require('./adminOrderRoutes');
const adminUserRoutes = require('./adminUserRoutes');
const adminInventoryRoutes = require('./adminInventoryRoutes');
const adminDeliveryRoutes = require('./adminDeliveryRoutes');
const adminSupportRoutes = require('./adminSupportRoutes');

// Every route below this line requires a valid, logged-in admin.
router.use(protect, authorize('admin'));

const SALES_OVERVIEW_DAYS = 14;

// @desc    Dashboard metrics: totals, pending orders, revenue, recent orders, sales trend
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get(
  '/dashboard',
  handle(async (req, res) => {
    // Start 13 days ago at UTC midnight to construct a precise 14-day rolling window including today
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - (SALES_OVERVIEW_DAYS - 1));
    since.setUTCHours(0, 0, 0, 0);

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      pendingOrders,
      revenueAgg,
      recentOrders,
      recentOrdersForChart
    ] = await Promise.all([
      Product.countDocuments({}),
      Order.countDocuments({}),
      User.countDocuments({}),
      Order.countDocuments({ status: 'Pending' }),
      Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      Order.find({}).populate('user', 'name email').sort({ createdAt: -1 }).limit(5),
      // Grouped by day in JS rather than with $dateToString: a plain find + reduce works
      // identically on every MongoDB-compatible deployment, including limited ones.
      Order.find({ createdAt: { $gte: since }, status: { $ne: 'Cancelled' } }, 'createdAt totalPrice')
    ]);

    // Fill in the days that had no orders so the chart has one point per day
    const byDate = new Map();
    recentOrdersForChart.forEach((o) => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      const entry = byDate.get(key) || { revenue: 0, orders: 0 };
      entry.revenue += o.totalPrice;
      entry.orders += 1;
      byDate.set(key, entry);
    });

    const salesOverview = [];
    for (let i = 0; i < SALES_OVERVIEW_DAYS; i += 1) {
      const day = new Date(since);
      day.setUTCDate(day.getUTCDate() + i);
      const key = day.toISOString().slice(0, 10);
      const found = byDate.get(key);
      salesOverview.push({ date: key, revenue: found ? Math.round(found.revenue * 100) / 100 : 0, orders: found?.orders || 0 });
    }

    res.json({
      metrics: {
        totalProducts,
        totalOrders,
        totalUsers,
        pendingOrders,
        revenue: Math.round((revenueAgg[0]?.total || 0) * 100) / 100
      },
      recentOrders,
      salesOverview
    });
  })
);

router.use('/products', adminProductRoutes);
router.use('/categories', adminCategoryRoutes);
router.use('/orders', adminOrderRoutes);
router.use('/users', adminUserRoutes);
router.use('/inventory', adminInventoryRoutes);
router.use('/delivery-rates', adminDeliveryRoutes);
router.use('/support', adminSupportRoutes);

module.exports = router;
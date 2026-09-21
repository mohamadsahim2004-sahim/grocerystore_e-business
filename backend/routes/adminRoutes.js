const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('admin'));
// @desc    Get dashboard metrics for administrative panel
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const userCount = await User.countDocuments();
    
    res.json({
      success: true,
      metrics: {
        totalProducts: productCount,
        totalUsers: userCount
      }
    });
  } catch (error) {
    console.error('❌ Admin Dashboard Error:', error);
    res.status(500).json({ message: 'Server Error fetching dashboard stats' });
  }
});

module.exports = router;

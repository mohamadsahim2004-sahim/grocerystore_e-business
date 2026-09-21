const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// @desc    Get all active product categories (name, slug, image, description)
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: { $ne: false } }).sort({ createdAt: 1, _id: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server Error fetching categories' });
  }
});

module.exports = router;
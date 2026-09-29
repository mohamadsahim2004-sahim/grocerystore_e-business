const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  try {
        // Deactivated (soft-deleted) products are admin-only; the storefront never lists them
    const products = await Product.find({ isActive: { $ne: false } });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    // A malformed id can never match a product: answer 404 instead of a cast-error 500
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const product = await Product.findById(req.params.id);
    if (product && product.isActive !== false) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
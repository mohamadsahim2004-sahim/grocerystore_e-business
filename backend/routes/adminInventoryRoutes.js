const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/Product');
const { HttpError, handle } = require('../utils/httpError');

const LOW_STOCK_THRESHOLD = 5; // matches the "Only N left" hint shown elsewhere in the store

// @desc    Stock-focused product list, lowest stock first
// @route   GET /api/admin/inventory
// @access  Private/Admin
router.get(
  '/',
  handle(async (req, res) => {
    const products = await Product.find({}, 'name image price stock isActive category')
      .populate('category', 'name')
      .sort({ stock: 1, name: 1 });

    res.json(
      products.map((p) => ({
        _id: p._id,
        name: p.name,
        image: p.image,
        price: p.price,
        stock: p.stock,
        isActive: p.isActive,
        category: p.category ? p.category.name : '',
        lowStock: p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD,
        outOfStock: p.stock <= 0
      }))
    );
  })
);

// @desc    Set a product's stock directly
// @route   PATCH /api/admin/inventory/:id
// @access  Private/Admin
router.patch(
  '/:id',
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Product not found');
    const stock = Number(req.body.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      throw new HttpError(400, 'Please check the highlighted fields', { errors: { stock: 'Stock must be a whole number of 0 or more' } });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, { stock }, { new: true }).populate('category', 'name');
    if (!product) throw new HttpError(404, 'Product not found');

    res.json({
      _id: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      stock: product.stock,
      isActive: product.isActive,
      category: product.category ? product.category.name : '',
      lowStock: product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD,
      outOfStock: product.stock <= 0
    });
  })
);

module.exports = router;
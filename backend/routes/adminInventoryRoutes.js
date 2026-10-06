const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/Product');
const { HttpError, handle } = require('../utils/httpError');

const LOW_STOCK_THRESHOLD = 5; // matches the "Only N left" hint shown elsewhere in the store

// Helper to standardise payload formatting for the admin table
function formatInventoryItem(p) {
  return {
    _id: p._id,
    name: p.name,
    image: p.image,
    price: p.price,
    stock: p.stock,
    isActive: p.isActive,
    category: p.category ? p.category.name : '',
    lowStock: p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD,
    outOfStock: p.stock <= 0
  };
}

// @desc    Stock-focused product list, lowest stock first
// @route   GET /api/admin/inventory
// @access  Private/Admin
router.get(
  '/',
  handle(async (req, res) => {
    const products = await Product.find({}, 'name image price stock isActive category')
      .populate('category', 'name')
      .sort({ stock: 1, name: 1 });

    res.json(products.map(formatInventoryItem));
  })
);

// @desc    Update product stock (supports direct stock assignment or relative delta with concurrency guard)
// @route   PATCH /api/admin/inventory/:id
// @access  Private/Admin
router.patch(
  '/:id',
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Product not found');

    const { stock: rawStock, delta: rawDelta, expectedStock } = req.body;

    // Check if product exists
    const existing = await Product.findById(req.params.id);
    if (!existing) throw new HttpError(404, 'Product not found');

    let targetStock = existing.stock;

    // Mode 1: Relative adjustment (e.g. adding incoming stock shipment)
    if (rawDelta !== undefined) {
      const delta = Number(rawDelta);
      if (!Number.isInteger(delta)) {
        throw new HttpError(400, 'Please check the highlighted fields', {
          errors: { delta: 'Stock adjustment must be a whole number' }
        });
      }
      targetStock = existing.stock + delta;
    } 
    // Mode 2: Direct stock override
    else if (rawStock !== undefined) {
      const stock = Number(rawStock);
      if (!Number.isInteger(stock) || stock < 0) {
        throw new HttpError(400, 'Please check the highlighted fields', {
          errors: { stock: 'Stock must be a whole number of 0 or more' }
        });
      }
      targetStock = stock;
    } else {
      throw new HttpError(400, 'Please provide stock or delta');
    }

    if (targetStock < 0) {
      throw new HttpError(400, 'Please check the highlighted fields', {
        errors: { stock: 'Stock cannot drop below 0' }
      });
    }

    // Concurrency Guard Check
    if (expectedStock !== undefined) {
      const expected = Number(expectedStock);
      if (!Number.isInteger(expected) || expected < 0) {
        throw new HttpError(400, 'Invalid expected stock value');
      }

      const result = await Product.updateOne(
        { _id: req.params.id, stock: expected },
        { $set: { stock: targetStock } }
      );

      if (result.matchedCount !== 1) {
        const current = await Product.findById(req.params.id, 'stock');
        throw new HttpError(409, `Stock changed to ${current?.stock} since you loaded this page. Nothing was saved.`, {
          code: 'STOCK_CHANGED',
          currentStock: current?.stock,
          errors: { stock: `Stock is now ${current?.stock}. Refresh to load latest quantity.` }
        });
      }
    } else {
      existing.stock = targetStock;
      await existing.save();
    }

    const updated = await Product.findById(req.params.id).populate('category', 'name');
    res.json(formatInventoryItem(updated));
  })
);

module.exports = router;
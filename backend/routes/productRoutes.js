const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');

// ============================================
// GET /api/products
// Get all active products (public)
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: { $ne: false }
    }).sort({ createdAt: -1 });

    return res.json(products);
  } catch (error) {
    return next(error);
  }
});

// ============================================
// GET /api/products/:id
// Get one active product (public)
// ============================================
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const product = await Product.findById(id);

    if (!product || product.isActive === false) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

// ============================================
// POST /api/products
// Create a product (admin only)
// ============================================
router.post('/', protect, admin, async (req, res, next) => {
  try {
    const {
      name,
      price,
      oldPrice,
      description,
      category,
      countInStock,
      image,
      isFeatured
    } = req.body;

    if (
      !name ||
      price === undefined ||
      price === null ||
      price === '' ||
      !description ||
      !category
    ) {
      return res.status(400).json({
        message: 'Name, price, description, and category are required'
      });
    }

    const parsedPrice = Number(price);
    const parsedStock =
      countInStock === undefined ? 0 : Number(countInStock);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        message: 'Price must be a valid non-negative number'
      });
    }

    if (
      !Number.isInteger(parsedStock) ||
      parsedStock < 0
    ) {
      return res.status(400).json({
        message: 'Stock must be a non-negative whole number'
      });
    }

    let parsedOldPrice;

    if (
      oldPrice !== undefined &&
      oldPrice !== null &&
      oldPrice !== ''
    ) {
      parsedOldPrice = Number(oldPrice);

      if (
        !Number.isFinite(parsedOldPrice) ||
        parsedOldPrice <= 0
      ) {
        return res.status(400).json({
          message: 'Old price must be a positive number'
        });
      }
    }

    const product = new Product({
      name: String(name).trim(),
      price: parsedPrice,
      ...(parsedOldPrice !== undefined && {
        oldPrice: parsedOldPrice
      }),
      description: String(description).trim(),
      category: String(category).trim(),
      countInStock: parsedStock,
      image: image || '',
      isFeatured: isFeatured === true || isFeatured === 'true',
      isActive: true
    });

    const createdProduct = await product.save();

    return res.status(201).json(createdProduct);
  } catch (error) {
    return next(error);
  }
});

// ============================================
// PUT /api/products/:id
// Update a product (admin only)
// ============================================
router.put('/:id', protect, admin, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const {
      name,
      price,
      oldPrice,
      description,
      category,
      countInStock,
      image,
      isFeatured,
      isActive
    } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          message: 'Product name cannot be empty'
        });
      }

      product.name = String(name).trim();
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);

      if (
        price === '' ||
        !Number.isFinite(parsedPrice) ||
        parsedPrice < 0
      ) {
        return res.status(400).json({
          message: 'Price must be a valid non-negative number'
        });
      }

      product.price = parsedPrice;
    }

    if (description !== undefined) {
      if (!String(description).trim()) {
        return res.status(400).json({
          message: 'Description cannot be empty'
        });
      }

      product.description = String(description).trim();
    }

    if (category !== undefined) {
      if (!String(category).trim()) {
        return res.status(400).json({
          message: 'Category cannot be empty'
        });
      }

      product.category = String(category).trim();
    }

    if (countInStock !== undefined) {
      const parsedStock = Number(countInStock);

      if (
        countInStock === '' ||
        !Number.isInteger(parsedStock) ||
        parsedStock < 0
      ) {
        return res.status(400).json({
          message: 'Stock must be a non-negative whole number'
        });
      }

      product.countInStock = parsedStock;
    }

    if (image !== undefined) {
      product.image = image;
    }

    if (isFeatured !== undefined) {
      product.isFeatured =
        isFeatured === true || isFeatured === 'true';
    }

    if (isActive !== undefined) {
      product.isActive =
        isActive === true || isActive === 'true';
    }

    // Allow the old price to be cleared.
    if (
      oldPrice === null ||
      oldPrice === '' ||
      oldPrice === 0 ||
      oldPrice === '0'
    ) {
      product.oldPrice = undefined;
    } else if (oldPrice !== undefined) {
      const parsedOldPrice = Number(oldPrice);

      if (
        !Number.isFinite(parsedOldPrice) ||
        parsedOldPrice <= 0
      ) {
        return res.status(400).json({
          message: 'Old price must be a positive number or empty'
        });
      }

      product.oldPrice = parsedOldPrice;
    }

    const updatedProduct = await product.save();

    return res.json(updatedProduct);
  } catch (error) {
    return next(error);
  }
});

// ============================================
// DELETE /api/products/:id
// Soft-delete a product (admin only)
// ============================================
router.delete('/:id', protect, admin, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    product.isActive = false;

    await product.save();

    return res.json({
      message: 'Product removed successfully'
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { HttpError, handle } = require('../utils/httpError');
const { uniqueSlug } = require('../utils/slugify');

const NUM_FIELDS = ['price', 'oldPrice', 'stock', 'rating', 'reviewCount'];
const STR_FIELDS = ['name', 'description', 'shortDescription', 'brand', 'image', 'unit', 'origin'];

function readBody(body, { partial } = { partial: false }) {
  const data = {};
  const errors = {};

  STR_FIELDS.forEach((key) => {
    if (body[key] !== undefined) data[key] = String(body[key]).trim();
  });
  if (!partial) {
    if (!data.name) errors.name = 'Name is required';
    if (!data.description) errors.description = 'Description is required';
    if (!data.image) errors.image = 'Image URL is required';
  }

  NUM_FIELDS.forEach((key) => {
    if (body[key] === undefined || body[key] === '') return;
    const n = Number(body[key]);
    if (!Number.isFinite(n) || n < 0) errors[key] = `${key} must be a positive number`;
    else data[key] = n;
  });

  // Explicitly clear oldPrice when sent as empty or null
  if (body.oldPrice === '' || body.oldPrice === null) {
    data.oldPrice = null;
  }

  if (!partial && data.price === undefined) errors.price = 'Price is required';
  if (!partial && data.stock === undefined) errors.stock = 'Stock is required';
  if (data.stock !== undefined && !Number.isInteger(data.stock)) errors.stock = 'Stock must be a whole number';

  // Validate oldPrice only when it is a numeric value
  if (typeof data.oldPrice === 'number' && data.price !== undefined && data.oldPrice > 0 && data.oldPrice <= data.price) {
    errors.oldPrice = 'Old price must be greater than the current price';
  }

  if (Array.isArray(body.images)) data.images = body.images.map(String).filter(Boolean);
  if (body.isFeatured !== undefined) data.isFeatured = Boolean(body.isFeatured);
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (typeof body.slug === 'string' && body.slug.trim()) data.slug = body.slug.trim();

  if (body.category !== undefined) {
    if (!mongoose.isValidObjectId(body.category)) errors.category = 'Choose a valid category';
    else data.category = body.category;
  } else if (!partial) {
    errors.category = 'Category is required';
  }

  if (Object.keys(errors).length) throw new HttpError(400, 'Please check the highlighted fields', { errors });
  return data;
}

// @desc    List every product (active and inactive) for the admin catalog
// @route   GET /api/admin/products
// @access  Private/Admin
router.get(
  '/',
  handle(async (req, res) => {
    const products = await Product.find({}).populate('category', 'name slug').sort({ createdAt: -1 });
    res.json(products);
  })
);

// @desc    Create a product
// @route   POST /api/admin/products
// @access  Private/Admin
router.post(
  '/',
  handle(async (req, res) => {
    const data = readBody(req.body, { partial: false });
    if (!(await Category.exists({ _id: data.category }))) {
      throw new HttpError(400, 'Please check the highlighted fields', { errors: { category: 'That category does not exist' } });
    }
    data.slug = data.slug ? await uniqueSlug(Product, data.slug) : await uniqueSlug(Product, data.name);
    const product = await Product.create(data);
    res.status(201).json(product);
  })
);

// @desc    Get one product by id (any status) - used to load the admin edit form
// @route   GET /api/admin/products/:id
// @access  Private/Admin
router.get(
  '/:id',
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Product not found');
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) throw new HttpError(404, 'Product not found');
    res.json(product);
  })
);

// @desc    Update a product (partial) with stock concurrency guard
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
router.put(
  '/:id',
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Product not found');
    const product = await Product.findById(req.params.id);
    if (!product) throw new HttpError(404, 'Product not found');

    const data = readBody(req.body, { partial: true });
    if (data.category && !(await Category.exists({ _id: data.category }))) {
      throw new HttpError(400, 'Please check the highlighted fields', { errors: { category: 'That category does not exist' } });
    }
    if (data.slug && data.slug !== product.slug) {
      data.slug = await uniqueSlug(Product, data.slug, product._id);
    }

    const { stock, ...rest } = data;
    const guardStock = stock !== undefined && req.body.expectedStock !== undefined;

    // Apply rest of non-stock metadata changes to mongoose document instance
    Object.assign(product, guardStock ? rest : data);
    await product.validate();

    if (guardStock) {
      const expected = Number(req.body.expectedStock);
      if (!Number.isInteger(expected) || expected < 0) {
        throw new HttpError(400, 'Invalid expected stock value');
      }

      const result = await Product.updateOne({ _id: product._id, stock: expected }, { $set: { stock } });

      if (result.matchedCount !== 1) {
        const current = await Product.findById(product._id, 'stock');
        throw new HttpError(409, `Stock changed to ${current?.stock} since you opened this form (orders were placed). Nothing was saved.`, {
          code: 'STOCK_CHANGED',
          currentStock: current?.stock,
          errors: { stock: `Stock is now ${current?.stock}. Enter the new total and save again.` }
        });
      }
    }

    await product.save(); // writes modified non-stock paths (and stock if not guarded)
    res.json(await Product.findById(product._id).populate('category', 'name slug'));
  })
);

// @desc    Deactivate a product (soft delete - keeps past orders intact)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
router.delete(
  '/:id',
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Product not found');
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) throw new HttpError(404, 'Product not found');
    res.json(product);
  })
);

module.exports = router;
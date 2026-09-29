const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { HttpError, handle } = require('../utils/httpError');
const { uniqueSlug } = require('../utils/slugify');

function readBody(body, { partial }) {
  const errors = {};
  const data = {};

  if (body.name !== undefined) data.name = String(body.name).trim();
  if (!partial && !data.name) errors.name = 'Name is required';

  if (body.description !== undefined) data.description = String(body.description).trim();
  if (body.image !== undefined) data.image = String(body.image).trim();
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (typeof body.slug === 'string' && body.slug.trim()) data.slug = body.slug.trim();

  if (Object.keys(errors).length) throw new HttpError(400, 'Please check the highlighted fields', { errors });
  return data;
}

// @desc    List every category (active and inactive) with a live product count
// @route   GET /api/admin/categories
// @access  Private/Admin
router.get(
  '/',
  handle(async (req, res) => {
    const [categories, counts] = await Promise.all([
      Category.find({}).sort({ createdAt: 1 }),
      Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }])
    ]);
    const countById = new Map(counts.map((c) => [String(c._id), c.count]));
    res.json(categories.map((c) => ({ ...c.toObject(), productCount: countById.get(String(c._id)) || 0 })));
  })
);

// @desc    Create a category
// @route   POST /api/admin/categories
// @access  Private/Admin
router.post(
  '/',
  handle(async (req, res) => {
    const data = readBody(req.body, { partial: false });
    data.slug = data.slug ? await uniqueSlug(Category, data.slug) : await uniqueSlug(Category, data.name);
    const category = await Category.create(data);
    res.status(201).json(category);
  })
);

// @desc    Get one category by id (any status) - used to load the admin edit form
// @route   GET /api/admin/categories/:id
// @access  Private/Admin
router.get(
  '/:id',
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Category not found');
    const category = await Category.findById(req.params.id);
    if (!category) throw new HttpError(404, 'Category not found');
    res.json(category);
  })
);

// @desc    Update a category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
router.put(
  '/:id',
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Category not found');
    const category = await Category.findById(req.params.id);
    if (!category) throw new HttpError(404, 'Category not found');

    const data = readBody(req.body, { partial: true });
    if (data.slug && data.slug !== category.slug) {
      data.slug = await uniqueSlug(Category, data.slug, category._id);
    }
    Object.assign(category, data);
    await category.save();
    res.json(category);
  })
);

// @desc    Delete a category (refused while any product still references it)
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
router.delete(
  '/:id',
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Category not found');
    const inUse = await Product.countDocuments({ category: req.params.id });
    if (inUse > 0) {
      throw new HttpError(409, `Cannot delete: ${inUse} product${inUse === 1 ? '' : 's'} still use this category`, {
        code: 'CATEGORY_IN_USE',
        productCount: inUse
      });
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) throw new HttpError(404, 'Category not found');
    res.json({ success: true });
  })
);

module.exports = router;
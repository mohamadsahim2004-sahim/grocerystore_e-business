const express = require('express');
const mongoose = require('mongoose');
// Mounted at /api/products/:productId/reviews
const router = express.Router({ mergeParams: true });
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { HttpError, handle } = require('../utils/httpError');

const MAX_COMMENT_LENGTH = 1000;

// Malformed or unknown (or deactivated) products answer 404, like GET /api/products/:id
const loadProduct = async (productId) => {
  if (!mongoose.isValidObjectId(productId)) throw new HttpError(404, 'Product not found');
  const product = await Product.findById(productId);
  if (!product || product.isActive === false) throw new HttpError(404, 'Product not found');
  return product;
};

// The client never says whether it bought the product - the orders collection decides.
const hasReceivedProduct = async (userId, productId) =>
  Boolean(await Order.exists({ user: userId, status: 'Delivered', 'orderItems.product': productId }));

// Returns clean { rating, comment } or throws a 400 with a specific message
const parseReviewBody = (body = {}) => {
  const rating = typeof body.rating === 'string' && body.rating.trim() !== '' ? Number(body.rating) : body.rating;
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, 'Rating must be a whole number from 1 to 5');
  }
  if (body.comment !== undefined && body.comment !== null && typeof body.comment !== 'string') {
    throw new HttpError(400, 'Review text must be a string');
  }
  const comment = (body.comment || '').trim();
  if (comment.length > MAX_COMMENT_LENGTH) {
    throw new HttpError(400, `Review text must be at most ${MAX_COMMENT_LENGTH} characters`);
  }
  return { rating, comment };
};

// Average rating (1 decimal) and number of reviews, computed from the real reviews
const ratingSummary = async (productId) => {
  const [reviewCount, [stats]] = await Promise.all([
    Review.countDocuments({ product: productId }),
    Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
      { $group: { _id: '$product', total: { $sum: '$rating' } } }
    ])
  ]);
  const rating = reviewCount > 0 && stats ? Math.round((stats.total / reviewCount) * 10) / 10 : 0;
  return { rating, reviewCount };
};

// Keep Product.rating / reviewCount in step with the real reviews (used by product cards and pages)
const syncProductRating = async (productId) => {
  const summary = await ratingSummary(productId);
  await Product.updateOne({ _id: productId }, { $set: summary });
  return summary;
};

// @desc    Reviews of a product (newest first) with the average rating
// @route   GET /api/products/:productId/reviews?page=&limit=
// @access  Public
router.get(
  '/',
  handle(async (req, res) => {
    const product = await loadProduct(req.params.productId);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const [reviews, summary] = await Promise.all([
      Review.find({ product: product._id })
        .populate('user', 'name') // never expose email or other user fields
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ratingSummary(product._id)
    ]);

    res.json({
      reviews,
      total: summary.reviewCount,
      page,
      pages: Math.max(1, Math.ceil(summary.reviewCount / limit)),
      averageRating: summary.rating,
      reviewCount: summary.reviewCount
    });
  })
);

// @desc    The signed-in customer's own review of this product + whether they may review it
// @route   GET /api/products/:productId/reviews/mine
// @access  Private
router.get(
  '/mine',
  protect,
  handle(async (req, res) => {
    const product = await loadProduct(req.params.productId);
    const review = await Review.findOne({ user: req.user._id, product: product._id });
    const canReview = !review && (await hasReceivedProduct(req.user._id, product._id));
    res.json({ review, canReview });
  })
);

// @desc    Create a review (only after a Delivered order containing this product)
// @route   POST /api/products/:productId/reviews
// @access  Private
router.post(
  '/',
  protect,
  handle(async (req, res) => {
    const product = await loadProduct(req.params.productId);
    const { rating, comment } = parseReviewBody(req.body);

    if (!(await hasReceivedProduct(req.user._id, product._id))) {
      throw new HttpError(403, 'You can only review products from your delivered orders');
    }
    if (await Review.exists({ user: req.user._id, product: product._id })) {
      throw new HttpError(409, 'You have already reviewed this product. You can edit your review instead');
    }

    let review;
    try {
      review = await Review.create({ user: req.user._id, product: product._id, rating, comment });
    } catch (error) {
      // Two simultaneous submits: the unique index lets only one through
      if (error.code === 11000) {
        throw new HttpError(409, 'You have already reviewed this product. You can edit your review instead');
      }
      throw error;
    }

    const summary = await syncProductRating(product._id);
    res.status(201).json({ review, product: summary });
  })
);

// @desc    Edit the signed-in customer's own review (identity always comes from the token)
// @route   PUT /api/products/:productId/reviews/mine
// @access  Private
router.put(
  '/mine',
  protect,
  handle(async (req, res) => {
    const product = await loadProduct(req.params.productId);
    const { rating, comment } = parseReviewBody(req.body);

    const review = await Review.findOneAndUpdate(
      { user: req.user._id, product: product._id },
      { $set: { rating, comment } },
      { returnDocument: 'after', runValidators: true }
    );
    if (!review) throw new HttpError(404, 'You have not reviewed this product yet');

    const summary = await syncProductRating(product._id);
    res.json({ review, product: summary });
  })
);

// @desc    Delete the signed-in customer's own review
// @route   DELETE /api/products/:productId/reviews/mine
// @access  Private
router.delete(
  '/mine',
  protect,
  handle(async (req, res) => {
    const product = await loadProduct(req.params.productId);
    const review = await Review.findOneAndDelete({ user: req.user._id, product: product._id });
    if (!review) throw new HttpError(404, 'You have not reviewed this product yet');

    const summary = await syncProductRating(product._id);
    res.json({ message: 'Review deleted', product: summary });
  })
);

// @desc    Moderation: an admin removes any review of this product (e.g. abusive text). Ratings are recalculated.
// @route   DELETE /api/products/:productId/reviews/:reviewId
// @access  Private/Admin
router.delete(
  '/:reviewId',
  protect,
  authorize('admin'),
  handle(async (req, res) => {
    const product = await loadProduct(req.params.productId);
    if (!mongoose.isValidObjectId(req.params.reviewId)) throw new HttpError(404, 'Review not found');

    const review = await Review.findOneAndDelete({ _id: req.params.reviewId, product: product._id });
    if (!review) throw new HttpError(404, 'Review not found');

    const summary = await syncProductRating(product._id);
    res.json({ message: 'Review removed', product: summary });
  })
);

module.exports = router;
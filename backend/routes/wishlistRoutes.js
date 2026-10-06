const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Helper to fetch populated wishlist items for a user
async function fetchPopulatedWishlist(userId) {
  const user = await User.findById(userId).populate({
    path: 'wishlist',
    match: { isActive: { $ne: false } },
    populate: { path: 'category', select: 'name' }
  });
  return user ? user.wishlist : [];
}

// @desc    Get the logged-in user's wishlist (populated active products only)
// @route   GET /api/wishlist
// @access  Private
router.get('/', async (req, res) => {
  try {
    const wishlist = await fetchPopulatedWishlist(req.user._id);
    res.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Server Error fetching wishlist' });
  }
});

// @desc    Add a product to the wishlist (idempotent)
// @route   POST /api/wishlist/:productId
// @access  Private
router.post('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    // Verify product exists and is active
    const product = await Product.findById(productId);
    if (!product || product.isActive === false) {
      return res.status(404).json({ message: 'Product not found or unavailable' });
    }

    // Atomically push to wishlist avoiding duplicates
    await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: productId } });

    const wishlist = await fetchPopulatedWishlist(req.user._id);
    res.status(201).json(wishlist);
  } catch (error) {
    console.error('Error updating wishlist:', error);
    res.status(500).json({ message: 'Server Error updating wishlist' });
  }
});

// @desc    Remove a product from the wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    // Atomically pull product from wishlist array
    await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: productId } });

    const wishlist = await fetchPopulatedWishlist(req.user._id);
    res.json(wishlist);
  } catch (error) {
    console.error('Error updating wishlist:', error);
    res.status(500).json({ message: 'Server Error updating wishlist' });
  }
});

module.exports = router;
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @desc    Get the logged-in user's wishlist (real, populated products only)
// @route   GET /api/wishlist
// @access  Private
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      match: { isActive: { $ne: false } }
    });
    res.json(user.wishlist);
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
    if (!mongoose.isValidObjectId(req.params.productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: req.params.productId } });
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      match: { isActive: { $ne: false } }
    });
    res.status(201).json(user.wishlist);
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
    if (!mongoose.isValidObjectId(req.params.productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: req.params.productId } });
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      match: { isActive: { $ne: false } }
    });
    res.json(user.wishlist);
  } catch (error) {
    console.error('Error updating wishlist:', error);
    res.status(500).json({ message: 'Server Error updating wishlist' });
  }
});

module.exports = router;
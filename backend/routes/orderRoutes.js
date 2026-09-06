const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.post('/', async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, orderItems, itemSubtotal, shippingFee, taxFee, totalPrice } = req.body;
    
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items specified' });
    }

    const order = new Order({
      shippingAddress,
      paymentMethod,
      orderItems,
      itemSubtotal,
      shippingFee,
      taxFee,
      totalPrice
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: 'Failed to process order', error: error.message });
  }
});

module.exports = router;
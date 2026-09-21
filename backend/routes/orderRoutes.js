const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

// ---------------------------------------------------------------------------
// Pricing rules live ONLY on the server. The client never supplies prices.
// ---------------------------------------------------------------------------
const MAX_LINES = 50;
const MAX_LINE_QTY = 99;
const FREE_SHIPPING_ABOVE_CENTS = 4900; // items total above $49.00 ships free
const SHIPPING_FLAT_CENTS = 490; // otherwise $4.90
const PROMO_CODES = {
  EXOTIC10: { percent: 10, message: '10% off your items' }
};

const toCents = (amount) => Math.round(Number(amount) * 100);
const fromCents = (cents) => Math.round(cents) / 100;

class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

// Runs tasks one at a time (a tiny in-process queue)
let queue = Promise.resolve();
const exclusive = (task) => {
  const run = queue.then(task);
  queue = run.catch(() => {});
  return run;
};

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message, ...error.extra });
    }
    console.error('Order route error:', error);
    res.status(500).json({ message: 'Something went wrong while processing your request' });
  }
};

// [{ productId, quantity }] -> validated, duplicate lines merged
function parseItems(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new HttpError(400, 'Your cart is empty');
  }
  if (raw.length > MAX_LINES) {
    throw new HttpError(400, `A single order can contain at most ${MAX_LINES} different products`);
  }

  const merged = new Map();
  for (const item of raw) {
    const productId = item && typeof item.productId === 'string' ? item.productId : '';
    const quantity = item ? item.quantity : undefined;
    if (!mongoose.isValidObjectId(productId) || productId.length !== 24) {
      throw new HttpError(400, 'One of the cart items has an invalid product id');
    }
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QTY) {
      throw new HttpError(400, `Quantity must be a whole number between 1 and ${MAX_LINE_QTY}`);
    }
    const total = (merged.get(productId) || 0) + quantity;
    if (total > MAX_LINE_QTY) {
      throw new HttpError(400, `Quantity must be a whole number between 1 and ${MAX_LINE_QTY}`);
    }
    merged.set(productId, total);
  }
  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

// Loads products from MongoDB and calculates every amount on the server.
async function priceCart(items, promoCode) {
  const products = await Product.find({ _id: { $in: items.map((i) => i.productId) } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines = items.map(({ productId, quantity }) => {
    const product = byId.get(productId);
    if (!product || product.isActive === false) {
      return { productId, name: 'Unavailable product', image: '', unit: '', price: 0, quantity, stock: 0, lineTotal: 0, issue: 'unavailable' };
    }
    let issue = null;
    if (product.stock <= 0) issue = 'out_of_stock';
    else if (quantity > product.stock) issue = 'insufficient_stock';
    return {
      productId,
      name: product.name,
      image: product.image,
      unit: product.unit,
      price: product.price,
      quantity,
      stock: product.stock,
      lineTotal: fromCents(toCents(product.price) * quantity),
      issue
    };
  });

  const itemsCents = lines.reduce((sum, l) => (l.issue === 'unavailable' ? sum : sum + toCents(l.price) * l.quantity), 0);

  const code = String(promoCode || '').trim().toUpperCase();
  const promoRule = code ? PROMO_CODES[code] : null;
  const promo = code
    ? promoRule
      ? { code, valid: true, message: promoRule.message, percent: promoRule.percent }
      : { code, valid: false, message: 'This promo code is not valid', percent: 0 }
    : null;

  const discountCents = promoRule ? Math.round((itemsCents * promoRule.percent) / 100) : 0;
  const shippingCents = itemsCents === 0 || itemsCents > FREE_SHIPPING_ABOVE_CENTS ? 0 : SHIPPING_FLAT_CENTS;
  const totalCents = itemsCents - discountCents + shippingCents;

  return {
    items: lines,
    itemsPrice: fromCents(itemsCents),
    discountPrice: fromCents(discountCents),
    shippingPrice: fromCents(shippingCents),
    totalPrice: fromCents(totalCents),
    freeShippingThreshold: fromCents(FREE_SHIPPING_ABOVE_CENTS),
    promo,
    issues: lines.filter((l) => l.issue).map((l) => ({ productId: l.productId, name: l.name, issue: l.issue, stock: l.stock })),
    canCheckout: lines.length > 0 && lines.every((l) => !l.issue)
  };
}

const text = (value, min, max, label, errors, key) => {
  const v = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (v.length < min || v.length > max) errors[key] = `${label} must be between ${min} and ${max} characters`;
  return v;
};

function parseShippingAddress(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const errors = {};
  const address = {
    fullName: text(src.fullName, 2, 100, 'Full name', errors, 'fullName'),
    phone: text(src.phone, 7, 20, 'Phone number', errors, 'phone'),
    street: text(src.street, 3, 200, 'Address', errors, 'street'),
    city: text(src.city, 2, 100, 'City', errors, 'city'),
    postalCode: text(src.postalCode, 2, 12, 'Postal code', errors, 'postalCode'),
    country: text(src.country, 2, 100, 'Country', errors, 'country')
  };
  if (!errors.phone && (!/^[+()\-\s\d]+$/.test(address.phone) || address.phone.replace(/\D/g, '').length < 7)) {
    errors.phone = 'Enter a valid phone number';
  }
  if (!errors.postalCode && !/^[A-Za-z0-9\- ]+$/.test(address.postalCode)) {
    errors.postalCode = 'Enter a valid postal code';
  }
  if (Object.keys(errors).length) {
    throw new HttpError(400, 'Please check your shipping details', { errors });
  }
  return address;
}

// @desc    Price a cart on the server (no login needed) - used by the Cart and Checkout pages
// @route   POST /api/orders/quote
// @access  Public
router.post(
  '/quote',
  handle(async (req, res) => {
    const items = parseItems(req.body.items);
    res.json(await priceCart(items, req.body.promoCode));
  })
);

// @desc    Current user's orders (Order History)
// @route   GET /api/orders/my
// @access  Private
router.get(
  '/my',
  protect,
  handle(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  })
);

// @desc    Create an order. Prices, totals and stock are all decided here.
// @route   POST /api/orders
// @access  Private
router.post(
  '/',
  protect,
  handle(async (req, res) => {
    const items = parseItems(req.body.items);
    const shippingAddress = parseShippingAddress(req.body.shippingAddress);

    const paymentMethod = req.body.paymentMethod;
    if (paymentMethod !== 'COD' && paymentMethod !== 'CARD') {
      throw new HttpError(400, 'Please choose a valid payment method');
    }

    const quote = await priceCart(items, req.body.promoCode);

    if (quote.promo && !quote.promo.valid) {
      throw new HttpError(400, quote.promo.message, { code: 'INVALID_PROMO' });
    }
    if (!quote.canCheckout) {
      throw new HttpError(409, 'Some items in your cart are no longer available in the requested quantity', { code: 'CART_ISSUES', quote });
    }
    if (req.body.expectedTotal !== undefined && Math.abs(Number(req.body.expectedTotal) - quote.totalPrice) > 0.005) {
      throw new HttpError(409, 'Prices have changed since you last viewed your cart. Please review the updated total.', {
        code: 'PRICE_CHANGED',
        quote
      });
    }

    // Reserve stock and create the order. Each product is decremented with a single conditional update
    // ({ stock >= quantity }), which MongoDB applies atomically, so stock can never go below zero.
    // exclusive() additionally serialises this section inside one server process.
    const order = await exclusive(async () => {
      const reserved = [];
      try {
        for (const line of quote.items) {
          const result = await Product.updateOne(
            { _id: line.productId, isActive: { $ne: false }, stock: { $gte: line.quantity } },
            { $inc: { stock: -line.quantity } }
          );
          if (result.modifiedCount !== 1) {
            throw new HttpError(409, `Sorry, "${line.name}" no longer has enough stock`, { code: 'INSUFFICIENT_STOCK' });
          }
          reserved.push(line);
        }

        return await Order.create({
          user: req.user._id,
          orderItems: quote.items.map((l) => ({
            product: l.productId,
            name: l.name,
            image: l.image,
            price: l.price,
            quantity: l.quantity
          })),
          shippingAddress,
          paymentMethod,
          itemsPrice: quote.itemsPrice,
          discountPrice: quote.discountPrice,
          promoCode: quote.promo ? quote.promo.code : '',
          shippingPrice: quote.shippingPrice,
          totalPrice: quote.totalPrice,
          // Simulated card payments are marked paid; nothing is charged and no card data is accepted or stored
          isPaid: paymentMethod === 'CARD',
          paidAt: paymentMethod === 'CARD' ? new Date() : undefined
        });
      } catch (error) {
        // Put reserved stock back if anything failed part-way
        await Promise.all(
          reserved.map((l) => Product.updateOne({ _id: l.productId }, { $inc: { stock: l.quantity } }).catch((e) => console.error('Stock restore failed:', e)))
        );
        throw error;
      }
    });

    res.status(201).json({ order });
  })
);

// @desc    One order (owner or admin only) - used by the Order Success page
// @route   GET /api/orders/:id
// @access  Private
router.get(
  '/:id',
  protect,
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new HttpError(404, 'Order not found');
    }
    const order = await Order.findById(req.params.id);
    const isOwner = order && String(order.user) === String(req.user._id);
    if (!order || (!isOwner && req.user.role !== 'admin')) {
      throw new HttpError(404, 'Order not found');
    }
    res.json(order);
  })
);

module.exports = router;
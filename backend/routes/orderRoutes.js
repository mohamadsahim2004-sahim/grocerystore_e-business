const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const { runWithOptionalTransaction, withSession } = require('../utils/transaction');
const { cancelOrder } = require('../utils/orderCancellation');
const { getEnabledRate } = require('../utils/deliveryRates');
const { PROVINCES } = require('../config/provinces');
const { FREE_SHIPPING_ABOVE } = require('../config/shipping');

// ---------------------------------------------------------------------------
// Pricing rules live ONLY on the server. The client never supplies prices.
// ---------------------------------------------------------------------------
const MAX_LINES = 50;
const MAX_LINE_QTY = 99;
const FREE_SHIPPING_ABOVE_CENTS = Math.round(FREE_SHIPPING_ABOVE * 100); // items total above this ships free
// Orders that can still be cancelled by the customer (before they are shipped)
const CUSTOMER_CANCELLABLE = ['Pending', 'Processing'];
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

// In-process lock to serialize concurrent order requests within a single process
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
async function priceCart(items, promoCode, province) {
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
  
  // Delivery: free above the threshold, otherwise the admin-configured charge of the chosen province.
  // Without a province the charge cannot be known yet ("pending") and is not added to the total.
  const chosenProvince = typeof province === 'string' && PROVINCES.includes(province) ? province : '';
  let deliveryRate = null;
  let provinceUnavailable = false;
  if (chosenProvince) {
    deliveryRate = await getEnabledRate(chosenProvince);
    provinceUnavailable = !deliveryRate;
  }
  const qualifiesForFree = itemsCents > FREE_SHIPPING_ABOVE_CENTS;
  let shippingCents = 0;
  let shippingPending = false;
  if (itemsCents > 0 && !qualifiesForFree) {
    if (deliveryRate) shippingCents = toCents(deliveryRate.charge);
    else shippingPending = true;
  }
  const totalCents = itemsCents - discountCents + shippingCents;

  return {
    items: lines,
    itemsPrice: fromCents(itemsCents),
    discountPrice: fromCents(discountCents),
    shippingPrice: fromCents(shippingCents),
    shippingPending,
    province: chosenProvince,
    provinceUnavailable,
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
    country: text(src.country, 2, 100, 'Country', errors, 'country'),
    province: typeof src.province === 'string' ? src.province.trim() : ''
  };
  if (!PROVINCES.includes(address.province)) errors.province = 'Select your delivery province';
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

// @desc    Price a cart on the server (no login needed) - used by Cart and Checkout
// @route   POST /api/orders/quote
// @access  Public
router.post(
  '/quote',
  handle(async (req, res) => {
    const items = parseItems(req.body.items);
    res.json(await priceCart(items, req.body.promoCode, req.body.province));
  })
);

// @desc    Current user's order history
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

// @desc    Create an order. Stock checks and price validation executed server-side.
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

    const idempotencyKey = req.body.idempotencyKey;
    if (idempotencyKey !== undefined && (typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey))) {
      throw new HttpError(400, 'Invalid checkout request. Please reload the page and try again.');
    }

    const findPrevious = () => (idempotencyKey ? Order.findOne({ user: req.user._id, idempotencyKey }) : null);
    const previous = await findPrevious();
    if (previous) return res.status(200).json({ order: previous, duplicate: true });

    const quote = await priceCart(items, req.body.promoCode, shippingAddress.province);

    if (quote.provinceUnavailable) {
      throw new HttpError(400, 'We are not delivering to the selected province right now. Please choose another one.', {
        code: 'PROVINCE_UNAVAILABLE',
        errors: { province: 'Delivery is not available to this province' }
      });
    }
    if (quote.shippingPending) {
      throw new HttpError(400, 'Select your delivery province to continue', { errors: { province: 'Select your delivery province' } });
    }
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

    const orderDoc = {
      user: req.user._id,
      idempotencyKey,
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
      // The charge is copied onto the order, so later changes to province rates never touch existing orders
      shippingPrice: quote.shippingPrice,
      totalPrice: quote.totalPrice,
      isPaid: paymentMethod === 'CARD',
      paidAt: paymentMethod === 'CARD' ? new Date() : undefined
    };

    let duplicate = false;
    const order = await exclusive(async () => {
      const existing = await findPrevious();
      if (existing) {
        duplicate = true;
        return existing;
      }

      try {
        // Handles replica set transactions automatically and falls back gracefully for standalone servers
        return await runWithOptionalTransaction(async (session) => {
          const reserved = [];
          try {
            for (const line of quote.items) {
              const result = await Product.updateOne(
                { _id: line.productId, isActive: { $ne: false }, stock: {$gte: line.quantity } },
                { $inc: { stock: -line.quantity } },
                withSession(session)
              );
              if (result.modifiedCount !== 1) {
                throw new HttpError(409, `Sorry, "${line.name}" no longer has enough stock`, { code: 'INSUFFICIENT_STOCK' });
              }
              reserved.push(line);
            }
            const [created] = await Order.create([orderDoc], withSession(session));
            return created;
          } catch (error) {
            if (!session) {
              // Roll back stock manually if running on a standalone Mongo server without transactions
              await Promise.all(
                reserved.map((l) =>
                  Product.updateOne({ _id: l.productId }, { $inc: { stock: l.quantity } }).catch((e) =>
                    console.error('Stock restore failed:', e)
                  )
                )
              );
            }
            throw error;
          }
        });
      } catch (error) {
        if (error && error.code === 11000 && idempotencyKey) {
          const other = await findPrevious();
          if (other) {
            duplicate = true;
            return other;
          }
        }
        throw error;
      }
    });

    res.status(duplicate ? 200 : 201).json(duplicate ? { order, duplicate: true } : { order });
  })
);

// @desc    Get order details (owner or admin only)
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

// @desc    Cancel one of the current user's own orders.
// @route   POST /api/orders/:id/cancel
// @access  Private (owner)
router.post(
  '/:id/cancel',
  protect,
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new HttpError(404, 'Order not found');
    }
    const result = await cancelOrder({
      orderId: req.params.id,
      userId: req.user._id,
      allowedStatuses: CUSTOMER_CANCELLABLE,
      cancelledBy: 'customer'
    });
    if (result.order) return res.json(result.order);
    if (result.reason === 'not_found') throw new HttpError(404, 'Order not found');
    if (result.reason === 'already_cancelled') {
      throw new HttpError(409, 'This order has already been cancelled', { code: 'ALREADY_CANCELLED', status: result.status });
    }
    throw new HttpError(409, `This order can no longer be cancelled because it is ${result.status.toLowerCase()}`, {
      code: 'NOT_CANCELLABLE',
      status: result.status
    });
  })
);

module.exports = router;
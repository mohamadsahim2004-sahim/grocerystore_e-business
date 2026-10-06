const crypto = require('crypto');
const Order = require('../models/Order');
const { HttpError } = require('../utils/httpError');

// ---------------------------------------------------------------------------
// PayHere Checkout API (https://support.payhere.lk/api-&-mobile-sdk/payhere-checkout)
//
//  1. POST /payments/payhere/params  (logged-in owner)  -> hash + form fields for the HTML POST form
//  2. Browser POSTs that form to PayHere's checkout page
//  3. PayHere server calls POST /payments/payhere/notify (form-urlencoded, no JWT)
//  4. Only a notification with a valid md5sig can mark an order as paid
//
// PAYHERE_MERCHANT_SECRET never leaves this file / the server.
// ---------------------------------------------------------------------------

const CHECKOUT_URLS = {
  sandbox: 'https://sandbox.payhere.lk/pay/checkout',
  live: 'https://www.payhere.lk/pay/checkout'
};
const CURRENCY = 'LKR';

// PayHere status_code values
const PAYHERE_STATUS = { SUCCESS: 2, PENDING: 0, CANCELED: -1, FAILED: -2, CHARGEDBACK: -3 };

const md5Upper = (value) => crypto.createHash('md5').update(String(value), 'utf8').digest('hex').toUpperCase();

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

// Exactly two decimals, no thousands separator ("1000.00") - this exact string is hashed and sent
const formatAmount = (value) => (Math.round(Number(value) * 100) / 100).toFixed(2);

const isObjectIdString = (value) => typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);

function getConfig() {
  const merchantId = (process.env.PAYHERE_MERCHANT_ID || '').trim();
  const merchantSecret = (process.env.PAYHERE_MERCHANT_SECRET || '').trim();
  if (!merchantId || !merchantSecret) {
    throw new HttpError(500, 'Online payment is not configured on the server (PAYHERE_MERCHANT_ID / PAYHERE_MERCHANT_SECRET).', {
      code: 'PAYHERE_NOT_CONFIGURED'
    });
  }
  return { merchantId, merchantSecret, sandbox: process.env.PAYHERE_SANDBOX !== 'false' };
}

// The store keeps every price in USD (see frontend config/currency.js: BASE_CURRENCY). PayHere charges in LKR,
// so the order total must be converted. Keep this rate in sync with the LKR rate in frontend/src/config/currency.js.
function getUsdToLkrRate() {
  const rate = Number(process.env.PAYHERE_USD_TO_LKR_RATE || 331);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new HttpError(500, 'PAYHERE_USD_TO_LKR_RATE is invalid.', { code: 'PAYHERE_NOT_CONFIGURED' });
  }
  return rate;
}

// md5( merchant_id + order_id + amount + currency + UPPER(md5(merchant_secret)) )
function generateCheckoutHash({ merchantId, merchantSecret, orderId, amount, currency }) {
  return md5Upper(`${merchantId}${orderId}${amount}${currency}${md5Upper(merchantSecret)}`);
}

// md5( merchant_id + order_id + payhere_amount + payhere_currency + status_code + UPPER(md5(merchant_secret)) )
function generateNotifySignature({ merchantId, merchantSecret, orderId, amount, currency, statusCode }) {
  return md5Upper(`${merchantId}${orderId}${amount}${currency}${statusCode}${md5Upper(merchantSecret)}`);
}

const isLocalUrl = (rawUrl) => {
  try {
    const host = new URL(rawUrl).hostname;
    return /^(localhost|127\.|0\.0\.0\.0|\[?::1\]?$|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(host) || host.endsWith('.local');
  } catch {
    return true;
  }
};

let warnedAboutNotifyUrl = false;
function resolveNotifyUrl(req) {
  const configured = (process.env.PAYHERE_NOTIFY_URL || '').trim();
  const url = configured || `${req.protocol}://${req.get('host')}/api/payments/payhere/notify`;
  if (!warnedAboutNotifyUrl && (!configured || isLocalUrl(url))) {
    warnedAboutNotifyUrl = true;
    console.warn(
      '[PayHere] PAYHERE_NOTIFY_URL is empty or not publicly reachable. PayHere cannot call it, so orders will NOT be ' +
        'marked as paid automatically. Set PAYHERE_NOTIFY_URL to a public https URL ending in /api/payments/payhere/notify.'
    );
  }
  return url;
}

// PayHere does not append the payment result to return_url/cancel_url, so the order id is added for the return pages
function withOrderId(rawUrl, orderId) {
  try {
    const url = new URL(rawUrl);
    url.searchParams.set('order_id', orderId);
    return url.toString();
  } catch {
    throw new HttpError(500, 'PAYHERE_RETURN_URL / PAYHERE_CANCEL_URL must be valid absolute URLs.', { code: 'PAYHERE_NOT_CONFIGURED' });
  }
}

const splitName = (fullName) => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || 'Customer', last: parts.slice(1).join(' ') || '-' };
};

// ---------------------------------------------------------------------------
// POST /api/payments/payhere/params   (private - order owner)
// Body: { orderId }. Amount, customer and address come from MongoDB, never from the client.
// ---------------------------------------------------------------------------
async function getPayHereParams(req, res) {
  const { merchantId, merchantSecret, sandbox } = getConfig();
  const rate = getUsdToLkrRate();

  const returnBase = (process.env.PAYHERE_RETURN_URL || '').trim();
  const cancelBase = (process.env.PAYHERE_CANCEL_URL || '').trim();
  if (!returnBase || !cancelBase) {
    throw new HttpError(500, 'PAYHERE_RETURN_URL and PAYHERE_CANCEL_URL must be set on the server.', { code: 'PAYHERE_NOT_CONFIGURED' });
  }

  const orderId = typeof req.body.orderId === 'string' ? req.body.orderId.trim() : '';
  if (!isObjectIdString(orderId)) throw new HttpError(404, 'Order not found');

  const order = await Order.findById(orderId);
  // Someone else's order looks exactly like a missing one
  if (!order || String(order.user) !== String(req.user._id)) throw new HttpError(404, 'Order not found');

  if (order.paymentMethod !== 'CARD') {
    throw new HttpError(400, 'This order is not an online payment order.', { code: 'NOT_ONLINE_PAYMENT' });
  }
  if (order.isPaid) throw new HttpError(409, 'This order has already been paid.', { code: 'ALREADY_PAID' });
  if (order.status === 'Cancelled') throw new HttpError(409, 'This order has been cancelled.', { code: 'ORDER_CANCELLED' });

  const amount = formatAmount(order.totalPrice * rate);
  if (!(Number(amount) > 0)) throw new HttpError(400, 'This order has no amount to pay.', { code: 'INVALID_AMOUNT' });

  const address = order.shippingAddress || {};
  const { first, last } = splitName(address.fullName || req.user.name);
  const items = order.orderItems.map((i) => `${i.name} x${i.quantity}`).join(', ').slice(0, 250) || `Order ${orderId}`;

  const params = {
    merchant_id: merchantId,
    return_url: withOrderId(returnBase, orderId),
    cancel_url: withOrderId(cancelBase, orderId),
    notify_url: resolveNotifyUrl(req),
    first_name: first,
    last_name: last,
    email: req.user.email,
    phone: address.phone,
    address: address.street,
    city: address.city,
    country: address.country,
    order_id: orderId,
    items,
    currency: CURRENCY,
    amount,
    // Echoed back in the notification and checked against the order owner there
    custom_1: String(order.user),
    hash: generateCheckoutHash({ merchantId, merchantSecret, orderId, amount, currency: CURRENCY })
  };

  // Remember exactly what was requested; the notification must match it
  await Order.updateOne({ _id: order._id, isPaid: false }, { $set: { payhereAmount: Number(amount), payhereCurrency: CURRENCY } });

  res.json({ sandbox, checkoutUrl: sandbox ? CHECKOUT_URLS.sandbox : CHECKOUT_URLS.live, params });
}

// ---------------------------------------------------------------------------
// POST /api/payments/payhere/notify   (public - called by PayHere, form-urlencoded)
// ---------------------------------------------------------------------------
async function handlePayHereNotify(req, res) {
  const { merchantId, merchantSecret } = getConfig();

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const field = (key) => (typeof body[key] === 'string' ? body[key].trim() : '');

  const merchant_id = field('merchant_id');
  const order_id = field('order_id');
  const payment_id = field('payment_id');
  const payhere_amount = field('payhere_amount');
  const payhere_currency = field('payhere_currency');
  const status_code = field('status_code');
  const md5sig = field('md5sig');
  const custom_1 = field('custom_1');
  const method = field('method');

  if (!merchant_id || !order_id || !payhere_amount || !payhere_currency || !status_code || !md5sig) {
    throw new HttpError(400, 'Malformed payment notification');
  }
  if (merchant_id !== merchantId) {
    console.warn('[PayHere] notification rejected: wrong merchant id');
    throw new HttpError(400, 'Invalid merchant');
  }

  // Verify the signature BEFORE touching the database. The amount/currency/status strings are hashed exactly as received.
  const expected = generateNotifySignature({
    merchantId,
    merchantSecret,
    orderId: order_id,
    amount: payhere_amount,
    currency: payhere_currency,
    statusCode: status_code
  });
  if (!safeEqual(expected, md5sig.toUpperCase())) {
    console.warn(`[PayHere] notification rejected: invalid md5sig (order_id=${order_id.slice(0, 40)})`);
    throw new HttpError(400, 'Invalid signature');
  }

  // ---- verified from here on ----
  if (!isObjectIdString(order_id)) throw new HttpError(404, 'Order not found');
  const order = await Order.findById(order_id);
  if (!order || order.paymentMethod !== 'CARD') throw new HttpError(404, 'Order not found');
  if (custom_1 && custom_1 !== String(order.user)) {
    console.warn(`[PayHere] notification rejected: customer mismatch (order ${order_id})`);
    throw new HttpError(400, 'Order mismatch');
  }

  // Must match what POST /payhere/params requested for this order
  const amountOk =
    Number.isFinite(Number(payhere_amount)) &&
    typeof order.payhereAmount === 'number' &&
    Math.abs(Number(payhere_amount) - order.payhereAmount) < 0.005;
  if (payhere_currency.toUpperCase() !== CURRENCY || order.payhereCurrency !== CURRENCY || !amountOk) {
    console.warn(`[PayHere] notification rejected: amount/currency mismatch (order ${order_id})`);
    throw new HttpError(400, 'Amount or currency mismatch');
  }

  if (!/^-?\d+$/.test(status_code)) throw new HttpError(400, 'Malformed payment notification');
  const code = Number(status_code);

  if (code === PAYHERE_STATUS.SUCCESS) {
    // Atomic and idempotent: only the first success flips isPaid, repeats match nothing and just get acknowledged
    const result = await Order.updateOne(
      { _id: order._id, isPaid: false },
      { $set: { isPaid: true, paidAt: new Date(), paymentStatus: 'Paid', payherePaymentId: payment_id || method } }
    );
    if (result.modifiedCount === 1 && order.status === 'Cancelled') {
      console.warn(`[PayHere] payment received for already-cancelled order ${order_id}. Refund it manually in the PayHere dashboard.`);
    }
  } else if (code === PAYHERE_STATUS.CHARGEDBACK) {
    await Order.updateOne({ _id: order._id, isPaid: true }, { $set: { isPaid: false, paymentStatus: 'Chargedback' } });
    console.warn(`[PayHere] order ${order_id} was charged back.`);
  } else if ([PAYHERE_STATUS.PENDING, PAYHERE_STATUS.CANCELED, PAYHERE_STATUS.FAILED].includes(code)) {
    const paymentStatus = code === PAYHERE_STATUS.PENDING ? 'Pending' : code === PAYHERE_STATUS.CANCELED ? 'Cancelled' : 'Failed';
    // Never touches an order that is already paid (late/out-of-order notifications)
    await Order.updateOne({ _id: order._id, isPaid: false }, { $set: { paymentStatus } });
  } else {
    throw new HttpError(400, 'Unknown payment status');
  }

  res.status(200).send('OK');
}

module.exports = {
  getPayHereParams,
  handlePayHereNotify,
  // exported for tests
  generateCheckoutHash,
  generateNotifySignature,
  formatAmount
};
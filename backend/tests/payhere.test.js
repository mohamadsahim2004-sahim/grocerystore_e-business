// Automated tests for checkout + PayHere payment handling. Run with:  npm test
//
// They exercise the REAL routes/controllers over HTTP. Only the Mongoose models are replaced by small in-memory
// stand-ins, so no MongoDB (and no PayHere account, network or public URL) is needed. Signatures in these tests are
// computed here from PayHere's documented formulas, independently of the controller code.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const req = (m) => require(path.join(ROOT, 'node_modules', m));
const express = req('express');
const jwt = req('jsonwebtoken');

const MERCHANT_ID = '1211149';
const SECRET = 'TEST-ONLY-merchant-secret';
Object.assign(process.env, {
  JWT_SECRET: 'test-jwt-secret',
  NODE_ENV: 'development',
  PAYHERE_MERCHANT_ID: MERCHANT_ID,
  PAYHERE_MERCHANT_SECRET: SECRET,
  PAYHERE_SANDBOX: 'true',
  PAYHERE_RETURN_URL: 'http://localhost:5173/payment/success',
  PAYHERE_CANCEL_URL: 'http://localhost:5173/payment/cancel',
  PAYHERE_USD_TO_LKR_RATE: '300'
});
delete process.env.PAYHERE_NOTIFY_URL;

// ---- in-memory stand-ins for the Mongoose models ----
const inject = (rel, exports) => {
  const p = require.resolve(path.join(ROOT, rel));
  require.cache[p] = { id: p, filename: p, loaded: true, exports };
};
const rates = new Map([['Western', { province: 'Western', charge: 3.5, enabled: true, confirmed: true, updatedAt: new Date() }]]);
inject('models/DeliveryRate.js', {
  find: async () => [...rates.values()],
  findOne: async ({ province }) => rates.get(province) || null,
  updateOne: async () => ({ modifiedCount: 0 })
});
const PID = 'a'.repeat(24);
const products = new Map([[PID, { _id: PID, name: 'Mango Chutney', image: '', unit: 'jar', price: 10, stock: 10, isActive: true }]]);
inject('models/Product.js', {
  find: async (q) => q._id.$in.map((id) => products.get(String(id))).filter(Boolean),
  updateOne: async (f, u) => {
    const p = products.get(String(f._id));
    if (!p || p.stock < f.stock.$gte) return { modifiedCount: 0 };
    p.stock += u.$inc.stock;
    return { modifiedCount: 1 };
  }
});
const orders = [];
let updates = 0; // counts writes that really changed an order
inject('models/Order.js', {
  findOne: async (q) => orders.find((o) => String(o.user) === String(q.user) && o.idempotencyKey === q.idempotencyKey) || null,
  findById: async (id) => orders.find((o) => o._id === id) || null,
  create: async ([doc]) => {
    const o = { _id: String(orders.length + 1).padStart(24, '0'), createdAt: new Date(), status: 'Pending', isPaid: false, paymentStatus: 'Unpaid', ...doc };
    orders.push(o);
    return [o];
  },
  updateOne: async (filter, update) => {
    const doc = orders.find((o) => Object.entries(filter).every(([k, v]) => o[k] === v));
    if (!doc) return { modifiedCount: 0 };
    Object.assign(doc, update.$set);
    updates += 1;
    return { modifiedCount: 1 };
  }
});
const users = {
  alice: { _id: 'alice', name: 'Alice Perera', email: 'alice@example.com', role: 'customer', isActive: true },
  bob: { _id: 'bob', name: 'Bob', email: 'bob@example.com', role: 'customer', isActive: true }
};
inject('models/User.js', { findById: async (id) => users[id] || null });
inject('utils/transaction.js', { runWithOptionalTransaction: (w) => w(null), withSession: () => ({}) });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api/orders', require(path.join(ROOT, 'routes/orderRoutes')));
app.use('/api/payments', require(path.join(ROOT, 'routes/paymentRoutes')));

let server;
let base;
test.before(() => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  // the controller warns that localhost cannot receive notifications; keep test output quiet
  console.warn = () => {};
});
test.after(() => server.close());
test.beforeEach(() => {
  products.get(PID).stock = 10; // every test starts with the same stock
});

const auth = (id) => ({ Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}` });
const call = async (method, url, body, headers = {}) => {
  const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json = {};
  try { json = JSON.parse(text); } catch { /* plain text such as "OK" */ }
  return { status: r.status, body: json, text };
};
const notify = async (fields) => {
  const r = await fetch(`${base}/payments/payhere/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields)
  });
  return { status: r.status, text: await r.text() };
};

// PayHere's documented formulas, written out independently
const md5U = (v) => crypto.createHash('md5').update(v).digest('hex').toUpperCase();
const checkoutHash = (orderId, amount, currency = 'LKR') => md5U(`${MERCHANT_ID}${orderId}${amount}${currency}${md5U(SECRET)}`);
const notification = (orderId, amount, statusCode, over = {}) => {
  const f = { merchant_id: MERCHANT_ID, order_id: orderId, payment_id: '320032', payhere_amount: amount, payhere_currency: 'LKR', status_code: String(statusCode), custom_1: 'alice', method: 'VISA', ...over };
  f.md5sig = over.md5sig || md5U(`${f.merchant_id}${f.order_id}${f.payhere_amount}${f.payhere_currency}${f.status_code}${md5U(SECRET)}`);
  return f;
};

const address = { fullName: 'Alice Perera', phone: '0771234567', street: '12 Temple Road', city: 'Colombo', postalCode: '00100', country: 'Sri Lanka', province: 'Western' };
async function placeOrder(paymentMethod, user = 'alice', extra = {}) {
  const r = await call('POST', '/orders', { items: [{ productId: PID, quantity: 2 }], shippingAddress: address, paymentMethod, ...extra }, auth(user));
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body.order;
}
async function startPayment(orderId, user = 'alice') {
  const r = await call('POST', '/payments/payhere/params', { orderId }, auth(user));
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body;
}
const stored = (id) => orders.find((o) => o._id === id);

// items 2 x 10 + delivery 3.5 = 23.5 USD -> 7050.00 LKR at the test rate of 300
const EXPECTED_LKR = '7050.00';

test('Cash on Delivery order is still created unpaid and untouched by PayHere', async () => {
  const stockBefore = products.get(PID).stock;
  const order = await placeOrder('COD');
  assert.equal(order.paymentMethod, 'COD');
  assert.equal(order.isPaid, false);
  assert.equal(order.totalPrice, 23.5);
  assert.equal(products.get(PID).stock, stockBefore - 2);
  const r = await call('POST', '/payments/payhere/params', { orderId: order._id }, auth('alice'));
  assert.equal(r.status, 400);
  assert.equal(r.body.code, 'NOT_ONLINE_PAYMENT');
});

test('PayHere order: server-side totals, unpaid until a verified notification', async () => {
  const order = await placeOrder('CARD', 'alice', { totalPrice: 1, shippingPrice: 0, isPaid: true, paymentStatus: 'Paid' });
  assert.equal(order.totalPrice, 23.5, 'client-supplied totals are ignored');
  assert.equal(order.isPaid, false, 'client cannot mark an order paid');
  assert.equal(order.paymentStatus, 'Unpaid');
  assert.equal(order.shippingAddress.province, 'Western');
});

test('checkout initiation: DB-based LKR amount, documented hash, Pending status, no secret leaked', async () => {
  const order = await placeOrder('CARD');
  const { sandbox, checkoutUrl, params } = await startPayment(order._id);
  assert.equal(sandbox, true);
  assert.equal(checkoutUrl, 'https://sandbox.payhere.lk/pay/checkout');
  assert.equal(params.amount, EXPECTED_LKR);
  assert.equal(params.currency, 'LKR');
  assert.equal(params.order_id, order._id);
  assert.equal(params.merchant_id, MERCHANT_ID);
  assert.equal(params.hash, checkoutHash(order._id, EXPECTED_LKR));
  assert.equal(params.return_url, `http://localhost:5173/payment/success?order_id=${order._id}`);
  assert.equal(params.cancel_url, `http://localhost:5173/payment/cancel?order_id=${order._id}`);
  assert.equal(stored(order._id).paymentStatus, 'Pending');
  assert.equal(stored(order._id).isPaid, false);
  assert.equal(JSON.stringify(params).includes(SECRET), false);
});

test('checkout initiation: only the owner, only logged in, only unpaid online orders', async () => {
  const order = await placeOrder('CARD');
  assert.equal((await call('POST', '/payments/payhere/params', { orderId: order._id })).status, 401);
  assert.equal((await call('POST', '/payments/payhere/params', { orderId: order._id }, auth('bob'))).status, 404);
  assert.equal((await call('POST', '/payments/payhere/params', { orderId: 'not-an-id' }, auth('alice'))).status, 404);
  await startPayment(order._id);
  await notify(notification(order._id, EXPECTED_LKR, 2));
  const again = await call('POST', '/payments/payhere/params', { orderId: order._id }, auth('alice'));
  assert.equal(again.status, 409);
  assert.equal(again.body.code, 'ALREADY_PAID');
});

test('browser return/cancel alone never pays an order, and no mock-payment endpoint exists', async () => {
  const order = await placeOrder('CARD');
  await startPayment(order._id);
  // the return page only reads the order; nothing in the API lets the browser flip it to paid
  const read = await call('GET', `/orders/${order._id}`, null, auth('alice'));
  assert.equal(read.body.isPaid, false);
  assert.equal(stored(order._id).isPaid, false);
  assert.equal((await call('POST', '/payments/test-success', { orderId: order._id }, auth('alice'))).status, 404);
});

test('notification: invalid signature is rejected and changes nothing', async () => {
  const order = await placeOrder('CARD');
  await startPayment(order._id);
  const writes = updates;
  const bad = await notify(notification(order._id, EXPECTED_LKR, 2, { md5sig: 'A'.repeat(32) }));
  assert.equal(bad.status, 400);
  assert.equal(stored(order._id).isPaid, false);
  assert.equal(updates, writes);
  const forged = notification(order._id, EXPECTED_LKR, 2);
  forged.status_code = '2';
  forged.payhere_amount = '1.00'; // signed for another amount
  assert.equal((await notify(forged)).status, 400);
  assert.equal(stored(order._id).isPaid, false);
});

test('notification: wrong merchant, currency, amount, unknown order and never-started payment are rejected', async () => {
  const order = await placeOrder('CARD');
  assert.equal((await notify(notification(order._id, EXPECTED_LKR, 2))).status, 400, 'payment was never started (no stored amount)');
  await startPayment(order._id);
  assert.equal((await notify(notification(order._id, EXPECTED_LKR, 2, { merchant_id: '999' }))).status, 400);
  assert.equal((await notify(notification(order._id, EXPECTED_LKR, 2, { payhere_currency: 'USD' }))).status, 400);
  assert.equal((await notify(notification(order._id, '7049.00', 2))).status, 400);
  assert.equal((await notify(notification('f'.repeat(24), EXPECTED_LKR, 2))).status, 404);
  assert.equal((await notify(notification(order._id, EXPECTED_LKR, 2, { custom_1: 'bob' }))).status, 400);
  assert.equal(stored(order._id).isPaid, false);
  assert.equal((await notify({ order_id: order._id })).status, 400, 'malformed notification');
});

test('notification: valid success marks paid once; duplicates are acknowledged without reprocessing; stock untouched', async () => {
  const order = await placeOrder('CARD');
  await startPayment(order._id);
  const stockAfterOrder = products.get(PID).stock;
  const first = await notify(notification(order._id, EXPECTED_LKR, 2));
  assert.equal(first.status, 200);
  assert.equal(first.text, 'OK');
  const doc = stored(order._id);
  assert.equal(doc.isPaid, true);
  assert.equal(doc.paymentStatus, 'Paid');
  assert.equal(doc.payherePaymentId, '320032');
  const paidAt = doc.paidAt;
  const writes = updates;
  for (let i = 0; i < 3; i++) assert.equal((await notify(notification(order._id, EXPECTED_LKR, 2))).status, 200);
  assert.equal(stored(order._id).paidAt, paidAt, 'repeat notifications must not change the order');
  assert.equal(updates, writes);
  assert.equal(products.get(PID).stock, stockAfterOrder, 'payment confirmation never touches stock');
});

test('notification: failed and cancelled payments are tracked, order stays unpaid and can be retried', async () => {
  const order = await placeOrder('CARD');
  await startPayment(order._id);
  assert.equal((await notify(notification(order._id, EXPECTED_LKR, -2))).status, 200);
  assert.equal(stored(order._id).paymentStatus, 'Failed');
  assert.equal(stored(order._id).isPaid, false);
  assert.equal((await notify(notification(order._id, EXPECTED_LKR, -1))).status, 200);
  assert.equal(stored(order._id).paymentStatus, 'Cancelled');
  assert.equal((await notify(notification(order._id, EXPECTED_LKR, 0))).status, 200);
  assert.equal(stored(order._id).paymentStatus, 'Pending');
  await startPayment(order._id); // customer tries again
  assert.equal((await notify(notification(order._id, EXPECTED_LKR, 2))).status, 200);
  assert.equal(stored(order._id).isPaid, true);
});

test('notification: a late failed/cancelled message cannot undo a successful payment', async () => {
  const order = await placeOrder('CARD');
  await startPayment(order._id);
  await notify(notification(order._id, EXPECTED_LKR, 2));
  await notify(notification(order._id, EXPECTED_LKR, -2));
  await notify(notification(order._id, EXPECTED_LKR, -1));
  assert.equal(stored(order._id).isPaid, true);
  assert.equal(stored(order._id).paymentStatus, 'Paid');
  assert.equal((await notify(notification(order._id, EXPECTED_LKR, 5))).status, 400, 'unknown status code');
});

test('live mode is refused outside production and without public https URLs', async () => {
  const order = await placeOrder('CARD');
  const saved = { ...process.env };
  try {
    process.env.PAYHERE_SANDBOX = 'false';
    process.env.NODE_ENV = 'development';
    let r = await call('POST', '/payments/payhere/params', { orderId: order._id }, auth('alice'));
    assert.equal(r.status, 500);
    assert.equal(r.body.code, 'PAYHERE_LIVE_BLOCKED');

    process.env.NODE_ENV = 'production';
    r = await call('POST', '/payments/payhere/params', { orderId: order._id }, auth('alice'));
    assert.equal(r.body.code, 'PAYHERE_LIVE_BLOCKED', 'localhost return/cancel and no notify url');

    Object.assign(process.env, {
      PAYHERE_NOTIFY_URL: 'https://api.example.com/api/payments/payhere/notify',
      PAYHERE_RETURN_URL: 'https://shop.example.com/payment/success',
      PAYHERE_CANCEL_URL: 'https://shop.example.com/payment/cancel'
    });
    r = await call('POST', '/payments/payhere/params', { orderId: order._id }, auth('alice'));
    assert.equal(r.status, 200);
    assert.equal(r.body.sandbox, false);
    assert.equal(r.body.checkoutUrl, 'https://www.payhere.lk/pay/checkout');
  } finally {
    Object.keys(process.env).forEach((k) => { if (!(k in saved)) delete process.env[k]; });
    Object.assign(process.env, saved);
  }
});

test('missing PayHere credentials give a clear server error, not a crash', async () => {
  const order = await placeOrder('CARD');
  const saved = process.env.PAYHERE_MERCHANT_SECRET;
  process.env.PAYHERE_MERCHANT_SECRET = '';
  const r = await call('POST', '/payments/payhere/params', { orderId: order._id }, auth('alice'));
  process.env.PAYHERE_MERCHANT_SECRET = saved;
  assert.equal(r.status, 500);
  assert.equal(r.body.code, 'PAYHERE_NOT_CONFIGURED');
});
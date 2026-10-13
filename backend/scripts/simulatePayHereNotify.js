// DEVELOPMENT / SANDBOX ONLY - NOT a real PayHere payment confirmation.
//
// PayHere cannot call a localhost notify_url, so on a local machine no real notification ever arrives. This script
// sends a correctly signed PayHere-style notification to YOUR local backend's real /api/payments/payhere/notify
// endpoint, so the signature, amount, idempotency and status handling can be exercised without a public URL.
// Orders paid this way carry a payment id starting with "SIMULATED-".
//
// Refuses to run unless NODE_ENV=development and PAYHERE_SANDBOX is not "false". The merchant secret is read from
// backend/.env and is never printed.
//
// Usage:
//   node scripts/simulatePayHereNotify.js <orderId> [success|pending|cancelled|failed|chargedback|<status_code>]
//                                         [--amount=<LKR>] [--bad-sig]
//   --amount   defaults to the amount stored on the order when the PayHere checkout was started
//   --bad-sig  corrupts the signature (the backend must reject it with 400)
require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');

if (process.env.NODE_ENV !== 'development') {
  console.error('Refusing to run: the simulator only works with NODE_ENV=development (set it in backend/.env).');
  process.exit(1);
}
if (process.env.PAYHERE_SANDBOX === 'false') {
  console.error('Refusing to run: PAYHERE_SANDBOX=false (live mode). The simulator is sandbox/development only.');
  process.exit(1);
}

const STATUS_CODES = { success: '2', pending: '0', cancelled: '-1', failed: '-2', chargedback: '-3' };

const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const badSig = flags.includes('--bad-sig');
const amountFlag = (flags.find((f) => f.startsWith('--amount=')) || '').slice('--amount='.length);
const [orderId, outcome = 'success'] = args;
const statusCode = STATUS_CODES[outcome] || outcome;

const merchantId = (process.env.PAYHERE_MERCHANT_ID || '').trim();
const secret = (process.env.PAYHERE_MERCHANT_SECRET || '').trim();

if (!orderId || !/^-?\d+$/.test(statusCode) || !merchantId || !secret) {
  console.error('Usage: node scripts/simulatePayHereNotify.js <orderId> [success|pending|cancelled|failed|chargedback|<status_code>] [--amount=<LKR>] [--bad-sig]');
  console.error('PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET must be set in backend/.env');
  process.exit(1);
}

const md5Upper = (v) => crypto.createHash('md5').update(String(v)).digest('hex').toUpperCase();

async function amountFor(id) {
  if (amountFlag) return Number(amountFlag);
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/exotic_store');
  try {
    const order = await require('../models/Order').findById(id, 'payhereAmount');
    return order ? order.payhereAmount : undefined;
  } finally {
    await mongoose.disconnect();
  }
}

(async () => {
  const raw = await amountFor(orderId);
  if (!Number.isFinite(raw) || raw <= 0) {
    console.error('No amount known for this order. Start the PayHere checkout for it first (so the amount is stored) or pass --amount=<LKR>.');
    process.exit(1);
  }
  const amount = raw.toFixed(2);
  const currency = 'LKR';
  let md5sig = md5Upper(`${merchantId}${orderId}${amount}${currency}${statusCode}${md5Upper(secret)}`);
  if (badSig) md5sig = md5sig.replace(/^./, (c) => (c === '0' ? '1' : '0'));

  const body = new URLSearchParams({
    merchant_id: merchantId,
    order_id: orderId,
    payment_id: `SIMULATED-${Date.now()}`,
    payhere_amount: amount,
    payhere_currency: currency,
    status_code: statusCode,
    md5sig,
    method: 'SIMULATED',
    status_message: 'SIMULATED notification (development only) - not a real PayHere payment'
  });

  const url = `http://localhost:${process.env.PORT || 5000}/api/payments/payhere/notify`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  console.log(`SIMULATED notification (status_code ${statusCode}, ${amount} ${currency}) -> ${res.status} ${res.statusText}: ${await res.text()}`);
})().catch((err) => {
  console.error('Simulation failed:', err.message);
  process.exit(1);
});
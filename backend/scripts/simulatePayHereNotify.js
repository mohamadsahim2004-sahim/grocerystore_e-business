// DEV/SANDBOX ONLY - sends a correctly signed PayHere-style notification to your local backend, so the
// notify flow can be tested without a public notify_url. It reads PAYHERE_MERCHANT_ID/SECRET from backend/.env
// (the secret is never printed).
//
// Usage:  node scripts/simulatePayHereNotify.js <orderId> <lkrAmount> [statusCode=2] [--bad-sig]
//   <lkrAmount> is the amount PayHere was asked to charge (shown as "Amount" in the params response / order.payhereAmount)
require('dotenv').config();
const crypto = require('crypto');

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run in production.');
  process.exit(1);
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const badSig = process.argv.includes('--bad-sig');
const [orderId, amountArg, statusCode = '2'] = args;
const merchantId = (process.env.PAYHERE_MERCHANT_ID || '').trim();
const secret = (process.env.PAYHERE_MERCHANT_SECRET || '').trim();

if (!orderId || !amountArg || !merchantId || !secret) {
  console.error('Usage: node scripts/simulatePayHereNotify.js <orderId> <lkrAmount> [statusCode=2] [--bad-sig]');
  console.error('PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET must be set in backend/.env');
  process.exit(1);
}

const md5Upper = (v) => crypto.createHash('md5').update(String(v)).digest('hex').toUpperCase();
const amount = Number(amountArg).toFixed(2);
const currency = 'LKR';
let md5sig = md5Upper(`${merchantId}${orderId}${amount}${currency}${statusCode}${md5Upper(secret)}`);
if (badSig) md5sig = md5sig.replace(/^./, (c) => (c === '0' ? '1' : '0'));

const body = new URLSearchParams({
  merchant_id: merchantId,
  order_id: orderId,
  payment_id: `SIM${Date.now()}`,
  payhere_amount: amount,
  payhere_currency: currency,
  status_code: String(statusCode),
  md5sig,
  method: 'VISA',
  status_message: 'Simulated notification'
});

const url = `http://localhost:${process.env.PORT || 5000}/api/payments/payhere/notify`;
fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  .then(async (res) => console.log(`${res.status} ${res.statusText}: ${await res.text()}`))
  .catch((err) => {
    console.error('Request failed:', err.message);
    process.exit(1);
  });
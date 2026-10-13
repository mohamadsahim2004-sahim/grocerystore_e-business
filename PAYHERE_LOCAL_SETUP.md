# PayHere (Sandbox) – local setup

Checkout offers two separate methods: **Cash on Delivery** and **Pay online with PayHere**. Everything below runs on
`localhost` – no ngrok, tunnel, domain or paid service.

## 1. Files changed

Backend (`backend/`)
- `controllers/paymentController.js` – payment becomes **Pending** before the redirect; live mode is refused unless `NODE_ENV=production` and the notify/return/cancel URLs are public `https` URLs. (Hashing, `md5sig` / merchant / order / currency / amount verification and idempotent notification handling were already here and are unchanged.)
- `routes/paymentRoutes.js` – removed the old `/payments/test-success` endpoint (it marked orders paid without any PayHere notification).
- `scripts/simulatePayHereNotify.js` – the development-only notification simulator (rewritten).
- `tests/payhere.test.js` – new automated tests (`npm test`).
- `package.json` – `"test": "node --test"` (no new dependency).
- `.env.example` – PayHere variables, sandbox and live separated.

Frontend (`frontend/src/`)
- `pages/CheckoutPage.jsx` – PayHere option; creates the order, then redirects to PayHere.
- `pages/OrderSuccessPage.jsx` – now also shows pending / paid / failed / cancelled online-payment status (polls the backend) and a "Pay with PayHere" retry.
- `pages/PaymentSuccess.jsx` – PayHere's `return_url` now forwards to the Order Success page.
- `pages/PaymentCancel.jsx` – shows the backend's payment status.

Project root: `PAYHERE_LOCAL_SETUP.md` (this file).

## 2. Sandbox Merchant ID and Secret

1. Create a sandbox account at <https://sandbox.payhere.lk>.
2. **Merchant ID:** Side Menu → *Integrations*.
3. **Merchant Secret:** in *Integrations*, add a domain/app and copy the secret shown next to it. The secret is specific to that domain/app (PayHere docs). For local testing, community guides add `localhost`; check what your sandbox dashboard accepts.

## 3. Environment variables

Put them in **`backend/.env`** (copy `backend/.env.example`; `.env` is git-ignored). The frontend needs no new variables
(it uses `VITE_API_URL`, default `http://localhost:5000/api`).

```
NODE_ENV=development
PAYHERE_SANDBOX=true
PAYHERE_MERCHANT_ID=<sandbox merchant id>
PAYHERE_MERCHANT_SECRET=<sandbox merchant secret>
PAYHERE_RETURN_URL=http://localhost:5173/payment/success
PAYHERE_CANCEL_URL=http://localhost:5173/payment/cancel
PAYHERE_NOTIFY_URL=            # leave empty locally (see section 6)
# PAYHERE_USD_TO_LKR_RATE=331  # store prices are USD, PayHere charges LKR; keep equal to frontend/src/config/currency.js
```
The merchant secret exists only in `backend/.env`; it is never sent to the browser or returned by an API.

## 4. Install

```
cd backend  && npm install
cd frontend && npm install
```
No new packages are required.

## 5. Run

```
cd backend  && npm run dev      # http://localhost:5000
cd frontend && npm run dev      # http://localhost:5173
cd backend  && npm test         # automated tests (no MongoDB / PayHere needed)
```

## 6. Test locally without ngrok (development-only simulator)

PayHere's servers must call `notify_url`, and PayHere states that payment notifications cannot be tested on localhost.
So on your machine no real notification arrives and an online order stays **Pending**. The browser returning from
PayHere never marks an order paid.

1. In the shop choose *Pay online with PayHere* and place the order (you are redirected to PayHere Sandbox).
2. Back on the site the Order Success page shows "waiting for payment confirmation".
3. Simulate the notification (needs `NODE_ENV=development`, `PAYHERE_SANDBOX` not `false`):

```
cd backend
node scripts/simulatePayHereNotify.js <orderId> success      # status 2  -> Paid
node scripts/simulatePayHereNotify.js <orderId> failed       # -2        -> Failed
node scripts/simulatePayHereNotify.js <orderId> cancelled    # -1        -> Cancelled
node scripts/simulatePayHereNotify.js <orderId> success --bad-sig   # must be rejected (400)
```
Run `success` twice to check that duplicates change nothing. The amount is read from the order (stored when the
PayHere checkout started). Simulated payments carry a payment id starting with `SIMULATED-` and are **not** real
PayHere payments. `npm test` covers the same cases (valid, failed, cancelled, wrong signature/merchant/currency/amount,
duplicates, live-mode guards).

## 7. Testing the PayHere Sandbox redirect

Place an online order: the browser should land on `sandbox.payhere.lk` showing the order amount in LKR. Pay with the test
cards listed in PayHere's "Sandbox & Testing" knowledge-base page, or press cancel.

Cannot be verified without a public notify endpoint: that PayHere really delivers its server-to-server notification to
this backend, and therefore a genuine end-to-end "Paid" result. Locally this is covered only by the simulator and tests.

## 8. Before enabling live payments

1. Deploy the backend on a public **HTTPS** URL; set `PAYHERE_NOTIFY_URL=https://<api>/api/payments/payhere/notify`.
2. Use your **live** Merchant ID/Secret (live domain/app approved by PayHere) with `PAYHERE_SANDBOX=false` and
   `NODE_ENV=production`, plus `https` `PAYHERE_RETURN_URL` / `PAYHERE_CANCEL_URL`. The server refuses live mode otherwise.
3. Set `CORS_ORIGIN` to your real frontend origin; never reuse sandbox credentials in production or live ones locally.
4. Run one small real payment and confirm the notification marks the order paid before launch.
5. The simulator refuses to run in production; do not deploy `scripts/` to a public path.
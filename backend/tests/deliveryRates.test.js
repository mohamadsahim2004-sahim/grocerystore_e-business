// Tests for GET /api/delivery-rates (the list the checkout page uses to fill the province dropdown) and for the
// DeliveryRate schema. Run with:  npm test   (no MongoDB needed - the model is replaced by an in-memory stand-in).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const req = (m) => require(path.join(ROOT, 'node_modules', m));
const express = req('express');

// ---- real schema check (no DB connection needed for validateSync) ----
// Loaded BEFORE the in-memory stand-in below replaces the module in require.cache.
const DeliveryRate = require(path.join(ROOT, 'models/DeliveryRate'));
test('DeliveryRate schema keeps the `confirmed` flag and defaults it to false', () => {
  assert.ok(DeliveryRate.schema.path('confirmed'), 'confirmed must be part of the schema');
  const fresh = new DeliveryRate({ province: 'Western', charge: 0 });
  assert.equal(fresh.confirmed, false);
  const saved = new DeliveryRate({ province: 'Western', charge: 3.5, confirmed: true });
  assert.equal(saved.confirmed, true);
  assert.equal(saved.validateSync(), undefined);
});

// ---- route tests with an in-memory model stand-in ----
const p = require.resolve(path.join(ROOT, 'models/DeliveryRate.js'));
delete require.cache[p];
let rows = [];
let failFind = false;
require.cache[p] = {
  id: p, filename: p, loaded: true,
  exports: {
    find: async () => {
      if (failFind) throw new Error('db down');
      return rows;
    },
    findOne: async ({ province }) => rows.find((r) => r.province === province) || null,
    updateOne: async ({ province }, update) => {
      if (!rows.some((r) => r.province === province)) rows.push({ province, ...update.$setOnInsert });
      return { modifiedCount: 0 };
    }
  }
};

const app = express();
app.use('/api/delivery-rates', require(path.join(ROOT, 'routes/deliveryRoutes')));
const { notFound, errorHandler } = require(path.join(ROOT, 'middleware/errorMiddleware'));
app.use(notFound);
app.use(errorHandler);

let server;
let base;
test.before(() => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  console.error = () => {};
});
test.after(() => server.close());
const get = async (url) => {
  const r = await fetch(base + url);
  return { status: r.status, body: await r.json() };
};

test('GET /api/delivery-rates exists and lists only enabled, admin-confirmed provinces in official order', async () => {
  rows = [
    { province: 'Central', charge: 5, enabled: true, confirmed: true },
    { province: 'Western', charge: 3.5, enabled: true, confirmed: true },
    { province: 'Southern', charge: 4, enabled: false, confirmed: true }, // disabled
    { province: 'Uva', charge: 0, enabled: true, confirmed: false } // not configured yet
  ];
  const r = await get('/delivery-rates');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.rates, [
    { province: 'Western', charge: 3.5 },
    { province: 'Central', charge: 5 }
  ]);
  assert.equal(typeof r.body.freeShippingAbove, 'number');
});

test('GET /api/delivery-rates returns an empty list (not fake prices) when nothing is configured', async () => {
  rows = [];
  const r = await get('/delivery-rates');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.rates, []);
});

test('GET /api/delivery-rates answers 500 with a message when the database fails', async () => {
  failFind = true;
  const r = await get('/delivery-rates');
  failFind = false;
  assert.equal(r.status, 500);
  assert.match(r.body.message, /Something went wrong/);
});

test('GET /api/delivery-rates/province still resolves a city and returns "" for unknown cities', async () => {
  assert.equal((await get('/delivery-rates/province?city=Kandy')).body.province, 'Central');
  assert.equal((await get('/delivery-rates/province?city=Nowhereville')).body.province, '');
});

test('unknown delivery routes still return the standard not-found error', async () => {
  const r = await get('/delivery-rates/nope/nope');
  assert.equal(r.status, 404);
  assert.match(r.body.message, /Route not found/);
});
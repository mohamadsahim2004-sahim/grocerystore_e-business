const test = require('node:test');
const assert = require('node:assert/strict');
const { validateProfileUpdate } = require('../utils/profileValidation');

test('accepts valid input and normalises it', () => {
  const { data, errors } = validateProfileUpdate({ name: '  Nimal   Perera ', email: '  Nimal@Example.COM ', phone: ' +94 77 123 4567 ' });
  assert.deepEqual(errors, {});
  assert.deepEqual(data, { name: 'Nimal Perera', email: 'nimal@example.com', phone: '+94 77 123 4567' });
});

test('ignores protected fields such as role, isActive, password and addresses', () => {
  const { data, errors } = validateProfileUpdate({
    name: 'Kasun',
    role: 'admin',
    isActive: false,
    password: 'hacked1234',
    addresses: [{ street: 'x' }],
    _id: '000000000000000000000000'
  });
  assert.deepEqual(errors, {});
  assert.deepEqual(Object.keys(data), ['name']);
});

test('rejects bad name, email and phone with field errors', () => {
  const { data, errors } = validateProfileUpdate({ name: 'A', email: 'not-an-email', phone: 'abc' });
  assert.deepEqual(data, {});
  assert.ok(errors.name && errors.email && errors.phone);
});

test('enforces length limits', () => {
  assert.ok(validateProfileUpdate({ name: 'x'.repeat(101) }).errors.name);
  assert.ok(validateProfileUpdate({ email: `${'a'.repeat(250)}@b.co` }).errors.email);
  assert.ok(validateProfileUpdate({ phone: '1'.repeat(21) }).errors.phone);
  assert.ok(validateProfileUpdate({ phone: '12345' }).errors.phone);
});

test('rejects non-string values instead of coercing them', () => {
  assert.ok(validateProfileUpdate({ name: { $ne: 'x' } }).errors.name);
  assert.ok(validateProfileUpdate({ email: ['a@b.co'] }).errors.email);
  assert.ok(validateProfileUpdate({ phone: 1234567 }).errors.phone);
});

test('an empty phone is allowed and clears the number; missing fields are left alone', () => {
  assert.deepEqual(validateProfileUpdate({ phone: '   ' }).data, { phone: '' });
  assert.deepEqual(validateProfileUpdate({ phone: null }).data, { phone: '' });
  assert.deepEqual(validateProfileUpdate({}).data, {});
  assert.deepEqual(validateProfileUpdate(undefined).errors, {});
});

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DbConfigError, redactMongoUri, getMongoUri, getMongoConnectOptions, parseMongoUri, classifyDbError, formatDbFailure
} = require('../utils/dbDiagnostics');

const SECRET = 'S3cretPassw0rd';
const SRV_URI = `mongodb+srv://store_user:${SECRET}@cluster0.abc1234.mongodb.net/?appName=Cluster0`;

test('redactMongoUri hides the password everywhere it appears', () => {
  assert.equal(redactMongoUri(SRV_URI), 'mongodb+srv://store_user:****@cluster0.abc1234.mongodb.net/?appName=Cluster0');
  assert.ok(!redactMongoUri(`failed for ${SRV_URI} twice`).includes(SECRET));
});

test('getMongoUri has no silent localhost fallback', () => {
  assert.throws(() => getMongoUri({}), (e) => e instanceof DbConfigError && e.code === 'MONGO_URI_MISSING');
  assert.throws(() => getMongoUri({ MONGO_URI: '   ' }), DbConfigError);
  assert.equal(getMongoUri({ MONGO_URI: ' mongodb://localhost:27017/x ' }), 'mongodb://localhost:27017/x');
});

test('getMongoConnectOptions only sets dbName when MONGO_DB_NAME is provided', () => {
  assert.equal(getMongoConnectOptions({}).dbName, undefined);
  assert.equal(getMongoConnectOptions({ MONGO_DB_NAME: ' exotic ' }).dbName, 'exotic');
});

test('parseMongoUri reads an SRV string and warns about the missing database name', () => {
  const p = parseMongoUri(SRV_URI);
  assert.equal(p.scheme, 'mongodb+srv');
  assert.equal(p.host, 'cluster0.abc1234.mongodb.net');
  assert.equal(p.user, 'store_user');
  assert.equal(p.hasPassword, true);
  assert.equal(p.dbName, '');
  assert.ok(p.problems.some((m) => /default database "test"/.test(m)));
  assert.ok(!JSON.stringify(p).includes(SECRET), 'parsed result must not contain the password');
});

test('parseMongoUri flags structural mistakes', () => {
  assert.equal(parseMongoUri('http://nope').valid, false);
  assert.ok(parseMongoUri('mongodb+srv://u:p@a.mongodb.net:27017/db').problems.some((m) => /port/.test(m)));
  assert.ok(parseMongoUri('mongodb+srv://u:p@w@a.mongodb.net/db').problems.some((m) => /percent-encoded/.test(m)));
  assert.ok(parseMongoUri('mongodb+srv://u:<password>@a.mongodb.net/db').problems.some((m) => /placeholder/.test(m)));
  assert.equal(parseMongoUri('mongodb://u:p@h1:27017,h2:27017/db').hosts.length, 2);
});

test('the exact error from the bug report is classified as a DNS resolver failure, not credentials', () => {
  const err = Object.assign(new Error('querySrv EBADRESP _mongodb._tcp.cluster0.9oa1i3x.mongodb.net'), { code: 'EBADRESP', syscall: 'querySrv', hostname: '_mongodb._tcp.cluster0.9oa1i3x.mongodb.net' });
  const c = classifyDbError(err, { host: 'cluster0.9oa1i3x.mongodb.net' });
  assert.equal(c.category, 'DNS_RESOLVER');
  assert.match(c.causes.join(' '), /NOT a wrong-password/);
  assert.match(c.steps.join(' '), /Resolve-DnsName -Type SRV -Name _mongodb\._tcp\.cluster0\.9oa1i3x\.mongodb\.net/);
});

test('classification of other failure modes', () => {
  assert.equal(classifyDbError(Object.assign(new Error('querySrv ENOTFOUND _mongodb._tcp.x.mongodb.net'), { code: 'ENOTFOUND', syscall: 'querySrv' })).category, 'DNS_NAME_NOT_FOUND');
  assert.equal(classifyDbError(Object.assign(new Error('bad auth : authentication failed'), { code: 18, codeName: 'AuthenticationFailed' })).category, 'AUTH');
  assert.equal(classifyDbError(Object.assign(new Error('Invalid scheme, expected connection string to start with "mongodb://"'), { name: 'MongoParseError' })).category, 'URI_INVALID');
  assert.equal(classifyDbError(Object.assign(new Error("Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted."), { name: 'MongoServerSelectionError' })).category, 'NETWORK_ACCESS');
  assert.equal(classifyDbError(Object.assign(new Error('Server selection timed out after 15000 ms'), { name: 'MongoServerSelectionError' })).category, 'SERVER_SELECTION');
  assert.equal(classifyDbError(new DbConfigError('MONGO_URI is not set', 'MONGO_URI_MISSING')).category, 'CONFIG');
  assert.equal(classifyDbError(new Error('something odd')).category, 'UNKNOWN');
});

test('formatDbFailure states the API is not running and never leaks the password', () => {
  const err = Object.assign(new Error(`bad auth for ${SRV_URI}`), { code: 18, codeName: 'AuthenticationFailed' });
  const text = formatDbFailure(err, parseMongoUri(SRV_URI));
  assert.match(text, /DATABASE CONNECTION FAILED - the API is NOT running/);
  assert.match(text, /cluster0\.abc1234\.mongodb\.net/);
  assert.ok(!text.includes(SECRET));
});
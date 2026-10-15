const mongoose = require('mongoose');
const { getMongoUri, getMongoConnectOptions, parseMongoUri, formatDbFailure } = require('../utils/dbDiagnostics');

let listenersAttached = false;

function attachConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  // After the first successful connect, make later outages visible instead of silent.
  mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB connection lost. Requests that need the database will fail until it reconnects.'));
  mongoose.connection.on('reconnected', () => console.log('[db] MongoDB connection restored.'));
  mongoose.connection.on('error', (err) => console.error(`[db] MongoDB error: ${err.message}`));
}

const isDbConnected = () => mongoose.connection.readyState === 1;

// Connects to MongoDB and RESOLVES only when connected. On failure it throws; it never exits the process itself, so
// the caller (server.js) decides what to do. The connection string comes only from MONGO_URI - no hidden fallback.
async function connectDB() {
  const uri = getMongoUri();
  const info = parseMongoUri(uri);
  const options = getMongoConnectOptions();

  if (info.valid) {
    console.log(`[db] Connecting to ${info.scheme}://${info.host}${options.dbName ? '/' + options.dbName : info.dbName ? '/' + info.dbName : ''} ...`);
    info.problems
      .filter((p) => !(options.dbName && /default database "test"/.test(p)))
      .forEach((p) => console.warn(`[db] Warning: ${p}`));  }

  attachConnectionListeners();
  try {
    const conn = await mongoose.connect(uri, options);
    console.log(`[db] MongoDB connected: host=${conn.connection.host} database=${conn.connection.name}`);
    return conn;
  } catch (error) {
    error.uriInfo = info.valid ? info : {};
    throw error;
  }
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.isDbConnected = isDbConnected;
module.exports.formatDbFailure = formatDbFailure;
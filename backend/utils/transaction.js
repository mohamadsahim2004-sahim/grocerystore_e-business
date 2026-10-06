const mongoose = require('mongoose');

// MongoDB transactions need a replica set (Atlas always is one). A standalone mongod - the usual local
// development setup - rejects the first command that carries a session. In that case the work is run
// again without a session, and the caller compensates manually (see `session === null` branches).
//
// undefined = not known yet, true/false = learned from the first attempt (so later calls skip the probe).
let transactionsSupported;

const isTransactionUnsupported = (err) => {
  const message = String((err && err.message) || '');
  return (
    (err && err.code === 20) || // IllegalOperation: "Transaction numbers are only allowed on a replica set member or mongos"
    /Transaction numbers are only allowed|replica set member|startTransaction|txnNumber|transactions? (are|is) not supported|not supported|not implemented|NotImplemented/i.test(
      message
    )
  );
};

// work(session) must be safe to run again from the start. `session` is null when transactions are unavailable.
async function runWithOptionalTransaction(work) {
  if (transactionsSupported !== false) {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await work(session);
      });
      transactionsSupported = true;
      return result;
    } catch (err) {
      // Only fall back when the server refused the transaction itself; real errors (stock, validation...) pass through
      if (transactionsSupported === true || !isTransactionUnsupported(err)) throw err;
      transactionsSupported = false;
    } finally {
      await session.endSession();
    }
  }
  return work(null);
}

// Mongoose options for an operation that may or may not be inside a transaction
const withSession = (session, options = {}) => (session ? { ...options, session } : options);

module.exports = { runWithOptionalTransaction, withSession, isTransactionUnsupported };
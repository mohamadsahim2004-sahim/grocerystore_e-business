const Order = require('../models/Order');
const Product = require('../models/Product');
const { runWithOptionalTransaction, withSession } = require('./transaction');

// Cancels an order and puts its items back in stock, exactly once.
//
// 1. The status change is a single conditional update ({ status: one of allowedStatuses }). MongoDB applies it
//    atomically, so of two simultaneous requests (two cancels, or a cancel racing a "Shipped" update that uses
//    the same kind of conditional write) only one can win. The loser restores nothing.
// 2. Only the winner restores stock. With a replica set both steps are one transaction. On a standalone server
//    (no transactions) the restore is compensated by hand: if it fails part-way the stock already returned is
//    taken out again and the order goes back to its previous status, so nothing is half-cancelled.
//
// Returns { order } on success, or { reason: 'not_found' | 'not_cancellable' | 'already_cancelled', status }.
async function cancelOrder({ orderId, userId = null, allowedStatuses, cancelledBy }) {
  const filter = { _id: orderId, status: { $in: allowedStatuses } };
  if (userId) filter.user = userId; // a customer can only ever touch their own order

  const cancelled = await runWithOptionalTransaction(async (session) => {
    const claimed = await Order.findOneAndUpdate(
      filter,
      { $set: { status: 'Cancelled', cancelledAt: new Date(), cancelledBy } },
      withSession(session, { returnDocument: 'before' }) // the document as it was, so we know the previous status
    );
    if (!claimed) return null;

    const restored = [];
    try {
      for (const item of claimed.orderItems) {
        if (item.product) {
          await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }, withSession(session));
          restored.push(item);
        }
      }
      return await Order.findOneAndUpdate(
        { _id: claimed._id },
        { $set: { stockRestored: true } },
        withSession(session, { returnDocument: 'after' })
      );
    } catch (err) {
      if (!session) {
        // No transaction to roll back: undo by hand
        await Promise.all(
          restored.map((item) =>
            Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } }).catch((e) =>
              console.error('Stock compensation failed:', e)
            )
          )
        );
        await Order.updateOne(
          { _id: claimed._id, status: 'Cancelled' },
          { $set: { status: claimed.status, stockRestored: false }, $unset: { cancelledAt: '', cancelledBy: '' } }
        ).catch((e) => console.error('Order status compensation failed:', e));
      }
      throw err;
    }
  });

  if (cancelled) return { order: cancelled };

  const lookup = { _id: orderId };
  if (userId) lookup.user = userId;
  const current = await Order.findOne(lookup, 'status');
  if (!current) return { reason: 'not_found' };
  if (current.status === 'Cancelled') return { reason: 'already_cancelled', status: current.status };
  return { reason: 'not_cancellable', status: current.status };
}

module.exports = { cancelOrder };
export const PAYMENT_LABELS = {
  COD: 'Cash on Delivery',
  CARD: 'Card (PayHere)'
};

// Human-readable payment state. isPaid is the source of truth; paymentStatus only explains why an online order is unpaid.
export const paymentStatusLabel = (order) => {
  if (order.isPaid) return 'Paid';
  if (order.paymentMethod !== 'CARD') return 'Pay on delivery';
  switch (order.paymentStatus) {
    case 'Pending':
      return 'Payment pending';
    case 'Failed':
      return 'Payment failed';
    case 'Cancelled':
      return 'Payment cancelled';
    case 'Chargedback':
      return 'Charged back';
    default:
      return 'Awaiting payment';
  }
};

// PayHere charges in LKR; this is the amount that was requested for the order
export const formatLkr = (amount) =>
  new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(amount) || 0);

export const formatOrderDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};
export const PAYMENT_LABELS = {
  COD: 'Cash on Delivery',
  CARD: 'Card (test payment)'
};

export const formatOrderDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};
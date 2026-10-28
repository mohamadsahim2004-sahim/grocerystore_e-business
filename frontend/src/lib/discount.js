// Single definition of "this product is discounted", used by the Discounts page.
// The catalog's discount model is: `price` is what the customer pays now and `oldPrice` is the original price.
// A product qualifies only when both are real numbers and the current price is positive and below the original.
// Nothing here changes or invents a price.

const toNumber = (value) => {
  const n = typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
  return Number.isFinite(n) ? n : NaN;
};

export const isDiscounted = (product) => {
  if (!product) return false;
  const price = toNumber(product.price);
  const oldPrice = toNumber(product.oldPrice);
  return price > 0 && oldPrice > price;
};

// Whole-number percentage off (at least 1 for any real discount); 0 when the product is not discounted.
export const getDiscountPercent = (product) => {
  if (!isDiscounted(product)) return 0;
  const price = toNumber(product.price);
  const oldPrice = toNumber(product.oldPrice);
  return Math.max(1, Math.round(((oldPrice - price) / oldPrice) * 100));
};

// Single source of truth for currencies.
//
// BASE currency: every price stored in the database and returned by the API (products, /orders/quote,
// orders) is in BASE_CURRENCY. It is never converted or rewritten - conversion happens only when a
// price is drawn on screen, via formatMoney() (used by StoreContext.formatPrice). Orders are recorded
// and validated by the server in the base currency, so `expectedTotal` etc. are unaffected.
//
// RATES: units of each currency per 1 BASE_CURRENCY. These are approximate mid-market reference rates
// for DISPLAY ONLY (no live rate feed). To update them, edit `rate` below and CURRENCY_RATES_AS_OF.

export const BASE_CURRENCY = 'USD';
export const CURRENCY_RATES_AS_OF = '2026-09-29';

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', locale: 'en-US', rate: 1 }, // base: rate must stay 1
  { code: 'LKR', name: 'Sri Lankan Rupee', locale: 'en-LK', rate: 331 },
  { code: 'EUR', name: 'Euro', locale: 'en-IE', rate: 0.88 },
  { code: 'GBP', name: 'British Pound', locale: 'en-GB', rate: 0.75 }
];

export const DEFAULT_CURRENCY = BASE_CURRENCY;
export const CURRENCY_STORAGE_KEY = 'exotic_currency';

export const isSupportedCurrency = (code) => CURRENCIES.some((c) => c.code === code);

const findCurrency = (code) => CURRENCIES.find((c) => c.code === code) || CURRENCIES.find((c) => c.code === BASE_CURRENCY);

// Converts an amount in the base currency into `code` (a pure number; does not touch the source value).
export const convertFromBase = (amount, code) => Number(amount) * findCurrency(code).rate;

// Formats an amount that is in the BASE currency for display in `code`.
export const formatMoney = (amountInBase, code = BASE_CURRENCY) => {
  const currency = findCurrency(code);
  return new Intl.NumberFormat(currency.locale, { style: 'currency', currency: currency.code }).format(
    convertFromBase(amountInBase, currency.code)
  );
};
// Single source of truth for currencies.
//
// BASE currency: every price stored in the database and returned by the API
// is in BASE_CURRENCY.
//
// Conversion happens only when displaying a price.

export const BASE_CURRENCY = 'USD';

export const CURRENCY_RATES_AS_OF =
  '2026-09-29';

export const CURRENCIES = [
  {
    code: 'USD',
    name: 'US Dollar',
    locale: 'en-US',
    rate: 1
  },
  {
    code: 'LKR',
    name: 'Sri Lankan Rupee',
    locale: 'en-LK',
    rate: 331
  },
  {
    code: 'EUR',
    name: 'Euro',
    locale: 'en-IE',
    rate: 0.88
  },
  {
    code: 'GBP',
    name: 'British Pound',
    locale: 'en-GB',
    rate: 0.75
  }
];

export const DEFAULT_CURRENCY =
  BASE_CURRENCY;

export const CURRENCY_STORAGE_KEY =
  'exotic_currency';

export const isSupportedCurrency = (
  code
) => {
  return CURRENCIES.some(
    (currency) =>
      currency.code === code
  );
};

const findCurrency = (
  code
) => {
  return (
    CURRENCIES.find(
      (currency) =>
        currency.code === code
    ) ||
    CURRENCIES.find(
      (currency) =>
        currency.code ===
        BASE_CURRENCY
    )
  );
};

export const convertFromBase = (
  amount,
  code
) => {
  const currency =
    findCurrency(code);

  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(numericAmount)
  ) {
    return 0;
  }

  return (
    numericAmount *
    currency.rate
  );
};

export const formatMoney = (
  amountInBase,
  code = BASE_CURRENCY
) => {
  const currency =
    findCurrency(code);

  const amount =
    convertFromBase(
      amountInBase,
      currency.code
    );

  return new Intl.NumberFormat(
    currency.locale,
    {
      style: 'currency',
      currency: currency.code
    }
  ).format(amount);
};
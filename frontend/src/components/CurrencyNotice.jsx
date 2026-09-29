import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import { BASE_CURRENCY, formatMoney } from '../config/currency';

// Shown under Cart/Checkout totals only when a non-base currency is selected, so it is always clear
// that the converted figures are for display and what the order is actually recorded in.
export default function CurrencyNotice({ amount }) {
  const { currency, t } = useContext(StoreContext);
  if (currency === BASE_CURRENCY || typeof amount !== 'number') return null;

  return (
    <p className="totals__hint" data-testid="currency-notice">
      {t('Prices are converted for display at approximate rates. Your order is recorded in {base}: {amount}.', {
        base: BASE_CURRENCY,
        amount: formatMoney(amount, BASE_CURRENCY)
      })}
    </p>
  );
}
import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';

// Asks the server to price the cart (POST /api/orders/quote).
// Everything money-related on the Cart and Checkout pages comes from this response,
// never from the prices saved in the browser.
export default function useCartQuote(cart, promoCode) {
  const [state, setState] = useState({ quote: null, loading: false, error: '' });
  const [attempt, setAttempt] = useState(0);

  const key = JSON.stringify([cart.map((i) => [i.id, i.quantity]), promoCode || '']);

  useEffect(() => {
    if (cart.length === 0) {
      setState({ quote: null, loading: false, error: '' });
      return undefined;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: '' }));

    // Small delay so rapid quantity clicks send one request
    const timer = setTimeout(() => {
      api
        .post('/orders/quote', {
          items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
          promoCode: promoCode || undefined
        })
        .then(({ data }) => {
          if (!cancelled) setState({ quote: data, loading: false, error: '' });
        })
        .catch((err) => {
          if (!cancelled) setState({ quote: null, loading: false, error: getErrorMessage(err, 'Could not calculate your cart.') });
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);
  const setQuote = useCallback((quote) => setState({ quote, loading: false, error: '' }), []);

  return { ...state, refresh, setQuote };
}
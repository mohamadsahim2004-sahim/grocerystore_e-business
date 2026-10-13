
import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';

export default function useCartQuote(cart, promoCode, province = '') {
  const [state, setState] = useState({
    quote: null,
    loading: false,
    error: ''
  });

  const [attempt, setAttempt] = useState(0);

  // Recalculate when the province changes, as well as when
  // the cart or promo code changes.
  const key = JSON.stringify([
    cart.map((item) => [item.id, item.quantity]),
    promoCode || '',
    province || ''
  ]);

  useEffect(() => {
    if (cart.length === 0) {
      setState({ quote: null, loading: false, error: '' });
      return undefined;
    }

    let cancelled = false;

    setState((prev) => ({
      ...prev,
      loading: true,
      error: ''
    }));

    const timer = setTimeout(() => {
      api
        .post('/orders/quote', {
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity
          })),
          promoCode: promoCode || undefined,
          province: province || ''
        })
        .then(({ data }) => {
          if (!cancelled) {
            setState({
              quote: data,
              loading: false,
              error: ''
            });
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setState({
              quote: null,
              loading: false,
              error: getErrorMessage(
                err,
                'Could not calculate your cart.'
              )
            });
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, attempt]);

  const refresh = useCallback(
    () => setAttempt((n) => n + 1),
    []
  );

  const setQuote = useCallback(
    (quote) => setState({ quote, loading: false, error: '' }),
    []
  );

  return { ...state, refresh, setQuote };
}

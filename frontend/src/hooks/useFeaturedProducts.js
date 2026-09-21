import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';

// Loads the homepage's featured products from GET /api/products.
// Products flagged `isFeatured` are preferred; if none are flagged, the first active products are used.
export default function useFeaturedProducts(limit = 10) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api
      .get('/products')
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.products;
        if (!Array.isArray(list)) throw new Error('Unexpected response from the products API.');

        const active = list
          .filter((p) => p.isActive !== false)
          .map((p) => ({ ...p, id: p.id || p._id }));
        const featured = active.filter((p) => p.isFeatured);
        setProducts((featured.length ? featured : active).slice(0, limit));
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load products.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [limit, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { products, loading, error, reload };
}
import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { isDiscounted } from '../lib/discount';

// Loads the real catalog (GET /api/products, the same endpoint the shop uses) and keeps only active,
// discounted products from every category. Products get a stable `id` like in useProductCatalog.
export default function useDiscountedProducts() {
  const [state, setState] = useState({ products: [], loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: '' }));

    api
      .get('/products')
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.products;
        if (!Array.isArray(list)) throw new Error('Unexpected response from the products API.');

        const products = list
          .filter((p) => p && p.isActive !== false && isDiscounted(p))
          .map((p) => ({
            ...p,
            id: p.id || p._id,
            categoryId: p.category && typeof p.category === 'object' ? p.category._id : p.category
          }));

        setState({ products, loading: false, error: '' });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ products: [], loading: false, error: getErrorMessage(err, 'Could not load discounted products.') });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, reload };
}

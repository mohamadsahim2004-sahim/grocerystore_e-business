import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';

// Loads the full catalog for the shop: GET /api/products + GET /api/categories.
// Products get a stable `id` and a `categoryId` (the API returns the category as an id or a populated object).
export default function useProductCatalog() {
  const [state, setState] = useState({ products: [], categories: [], loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: '' }));

    Promise.all([api.get('/products'), api.get('/categories')])
      .then(([productRes, categoryRes]) => {
        if (cancelled) return;
        const productList = Array.isArray(productRes.data) ? productRes.data : productRes.data?.products;
        if (!Array.isArray(productList)) throw new Error('Unexpected response from the products API.');

        const products = productList
          .filter((p) => p.isActive !== false)
          .map((p) => ({
            ...p,
            id: p.id || p._id,
            categoryId: p.category && typeof p.category === 'object' ? p.category._id : p.category
          }));

        // Only real category documents are usable (older API versions returned bare ids)
        const categories = (Array.isArray(categoryRes.data) ? categoryRes.data : []).filter(
          (c) => c && typeof c === 'object' && c.slug
        );

        setState({ products, categories, loading: false, error: '' });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ products: [], categories: [], loading: false, error: getErrorMessage(err, 'Could not load products.') });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, reload };
}
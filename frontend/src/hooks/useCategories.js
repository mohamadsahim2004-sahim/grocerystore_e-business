import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';

// Loads the active categories from GET /api/categories (used by the Home and Categories pages).
export default function useCategories() {
  const [state, setState] = useState({ categories: [], loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: '' }));

    api
      .get('/categories')
      .then(({ data }) => {
        if (cancelled) return;
        if (!Array.isArray(data)) throw new Error('Unexpected response from the categories API.');
        setState({ categories: data.filter((c) => c && typeof c === 'object' && c.slug && c.name), loading: false, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState({ categories: [], loading: false, error: getErrorMessage(err, 'Could not load categories.') });
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, reload };
}
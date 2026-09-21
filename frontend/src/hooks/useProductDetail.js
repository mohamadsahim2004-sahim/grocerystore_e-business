import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';

const OBJECT_ID = /^[a-f\d]{24}$/i;
const RELATED_LIMIT = 4;

const normalizeProduct = (product) => {
  if (!product || typeof product !== 'object') {
    return null;
  }

  const id = product.id || product._id;

  const categoryIsObject =
    product.category && typeof product.category === 'object';

  const categoryId = categoryIsObject
    ? product.category._id || product.category.id
    : product.category;

  // Some API responses populate `category` with the full document; keep it
  // as a fallback so the breadcrumb still works if the /categories list
  // call fails, is slow, or the category was already embedded.
  const categoryInfo = categoryIsObject
    ? {
        id: categoryId,
        name: product.category.name,
        slug: product.category.slug
      }
    : null;

  return {
    ...product,
    id,
    categoryId,
    categoryInfo
  };
};

const extractProducts = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  return [];
};

const extractCategories = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.categories)) {
    return data.categories;
  }

  return [];
};

export default function useProductDetail(id) {
  const [state, setState] = useState({
    status: 'loading',
    error: '',
    product: null,
    category: null,
    related: [],
    relatedLoading: false
  });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!id || !OBJECT_ID.test(id)) {
      setState({
        status: 'notfound',
        error: '',
        product: null,
        category: null,
        related: [],
        relatedLoading: false
      });

      return undefined;
    }

    setState({
      status: 'loading',
      error: '',
      product: null,
      category: null,
      related: [],
      relatedLoading: false
    });

    const loadProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);

        if (cancelled) return;

        const rawProduct =
          response.data?.product || response.data;

        const product = normalizeProduct(rawProduct);

        if (!product || !product.id) {
          setState({
            status: 'notfound',
            error: '',
            product: null,
            category: null,
            related: [],
            relatedLoading: false
          });

          return;
        }

        setState({
          status: 'ready',
          error: '',
          product,
          category: product.categoryInfo,
          related: [],
          relatedLoading: true
        });

        /*
         * Related products and category information are secondary.
         * They must not prevent the main product from displaying.
         */
        const results = await Promise.allSettled([
          api.get('/products'),
          api.get('/categories')
        ]);

        if (cancelled) return;

        const productsResult = results[0];
        const categoriesResult = results[1];

        const productList =
          productsResult.status === 'fulfilled'
            ? extractProducts(productsResult.value.data)
            : [];

        const categories =
          categoriesResult.status === 'fulfilled'
            ? extractCategories(categoriesResult.value.data)
            : [];

        const normalizedProducts = productList
          .map(normalizeProduct)
          .filter(Boolean);

        const related = normalizedProducts
          .filter((item) => item.id !== product.id)
          .filter((item) => item.isActive !== false)
          .filter(
            (item) =>
              product.categoryId &&
              item.categoryId &&
              String(item.categoryId) === String(product.categoryId)
          )
          .sort(
            (a, b) =>
              Number(b.reviewCount || 0) -
              Number(a.reviewCount || 0)
          )
          .slice(0, RELATED_LIMIT);

        const category =
          product.categoryInfo ||
          categories.find((item) => {
            const categoryId = item?._id || item?.id;

            return (
              categoryId &&
              product.categoryId &&
              String(categoryId) === String(product.categoryId)
            );
          }) ||
          null;

        setState((previous) => ({
          ...previous,
          category,
          related,
          relatedLoading: false
        }));
      } catch (error) {
        if (cancelled) return;

        if (error?.response?.status === 404) {
          setState({
            status: 'notfound',
            error: '',
            product: null,
            category: null,
            related: [],
            relatedLoading: false
          });

          return;
        }

        setState({
          status: 'error',
          error: getErrorMessage(
            error,
            'Could not load this product.'
          ),
          product: null,
          category: null,
          related: [],
          relatedLoading: false
        });
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const reload = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  return {
    ...state,
    reload
  };
}
import React, { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { AlertIcon, TagIcon } from '../components/Icons';
import useDiscountedProducts from '../hooks/useDiscountedProducts';
import { getDiscountPercent } from '../lib/discount';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'discount', label: 'Biggest discount' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name: A to Z' }
];

const SORTERS = {
  discount: (a, b) => getDiscountPercent(b) - getDiscountPercent(a) || a.name.localeCompare(b.name),
  'price-asc': (a, b) => a.price - b.price || a.name.localeCompare(b.name),
  'price-desc': (a, b) => b.price - a.price || a.name.localeCompare(b.name),
  newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  name: (a, b) => a.name.localeCompare(b.name)
};

export default function DiscountsPage() {
  const { products, loading, error, reload } = useDiscountedProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef(null);

  const sort = SORTERS[searchParams.get('sort')] ? searchParams.get('sort') : 'discount';
  const requestedPage = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);

  useEffect(() => {
    document.title = 'Discounts | EXOTIC Food Market';
  }, []);

  const sorted = useMemo(() => [...products].sort(SORTERS[sort]), [products, sort]);
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from = sorted.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(page * PAGE_SIZE, sorted.length);

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  const goToPage = (n) => {
    updateParams({ page: n === 1 ? '' : String(n) });
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderResults = () => {
    if (loading) return <LoadingSpinner label="Loading discounted products..." />;
    if (error) {
      return (
        <EmptyState
          icon={<AlertIcon size={32} />}
          title="We couldn't load the discounted products"
          message={error}
          action={{ label: 'Try again', onClick: reload }}
        />
      );
    }
    if (products.length === 0) {
      return (
        <EmptyState
          icon={<TagIcon size={32} />}
          title="No discounted products available right now"
          message="Please check back soon, or browse everything in the shop."
          action={{ label: 'Browse all products', to: '/shop' }}
        />
      );
    }
    return (
      <>
        <div className="product-grid product-grid--shop">
          {pageItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <Pagination page={page} pages={pages} onChange={goToPage} />
      </>
    );
  };

  const hasResults = !loading && !error && products.length > 0;

  return (
    <div className="container page-section discounts-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Discounts</span>
      </nav>

      <section className="discounts-hero" aria-labelledby="discounts-title" ref={resultsRef}>
        <span className="discounts-hero__icon" aria-hidden="true">
          <TagIcon size={28} />
        </span>
        <div className="discounts-hero__text">
          <h1 id="discounts-title" className="shop-title">
            Discounts
          </h1>
          <p>Every product currently on offer, from all categories.</p>
          {hasResults && (
            <p className="shop-count" role="status" data-testid="discount-count">
              {`Showing ${from}\u2013${to} of ${sorted.length} discounted ${sorted.length === 1 ? 'product' : 'products'}`}
            </p>
          )}
        </div>

        {hasResults && (
          <label className="sort-select">
            <span>Sort by</span>
            <select value={sort} onChange={(e) => updateParams({ sort: e.target.value === 'discount' ? '' : e.target.value, page: '' })}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      {renderResults()}
    </div>
  );
}

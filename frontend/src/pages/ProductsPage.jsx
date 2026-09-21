import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import ShopFilters from '../components/ShopFilters';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { FilterIcon, CloseIcon, AlertIcon } from '../components/Icons';
import useProductCatalog from '../hooks/useProductCatalog';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name: A to Z' }
];

const SORTERS = {
  popularity: (a, b) => (b.reviewCount || 0) - (a.reviewCount || 0) || a.name.localeCompare(b.name),
  'price-asc': (a, b) => a.price - b.price || a.name.localeCompare(b.name),
  'price-desc': (a, b) => b.price - a.price || a.name.localeCompare(b.name),
  rating: (a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0),
  newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  name: (a, b) => a.name.localeCompare(b.name)
};

const isAvailable = (p) => (typeof p.stock === 'number' ? p.stock > 0 : true);
const numParam = (params, key) => {
  const v = parseFloat(params.get(key));
  return Number.isFinite(v) && v >= 0 ? v : null;
};

export default function ProductsPage() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setSearchQuery } = useContext(StoreContext);
  const { products, categories, loading, error, reload } = useProductCatalog();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const resultsRef = useRef(null);

  // ---- Filters from the URL --------------------------------------------------
  const rawQuery = searchParams.get('q') || '';
  const query = rawQuery.trim().toLowerCase();
  const slug = categorySlug || searchParams.get('category') || '';
  const filters = {
    min: numParam(searchParams, 'min'),
    max: numParam(searchParams, 'max'),
    rating: numParam(searchParams, 'rating') || 0,
    brands: searchParams.getAll('brand'),
    inStock: searchParams.get('stock') === '1'
  };
  const sort = SORTERS[searchParams.get('sort')] ? searchParams.get('sort') : 'popularity';
  const requestedPage = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);

  // Keep the header search box in step with the URL
  useEffect(() => {
    setSearchQuery(rawQuery);
  }, [rawQuery, setSearchQuery]);

  // Lock page scroll and support Escape while the mobile drawer is open
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  const updateParams = (patch, { replace = false } = {}) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      next.delete(key);
      if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
      else if (value !== '' && value !== null && value !== undefined && value !== false) next.set(key, value === true ? '1' : value);
    });
    if (!('page' in patch)) next.delete('page');
    setSearchParams(next, { replace });
  };

  const categoryHref = (targetSlug) => {
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    next.delete('category');
    const qs = next.toString();
    return `${targetSlug ? `/shop/${targetSlug}` : '/shop'}${qs ? `?${qs}` : ''}`;
  };

  const clearFilters = () => {
    setSearchQuery('');
    navigate(slug && categorySlug ? `/shop/${categorySlug}` : '/shop');
  };

  // ---- Derived data ----------------------------------------------------------
  const activeCategory = categories.find((c) => c.slug === slug) || null;
  const categoryMissing = !loading && !error && slug && categories.length > 0 && !activeCategory;

  const categoryList = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    });
    return categories.map((c) => ({ ...c, count: counts[c._id] || 0 }));
  }, [products, categories]);

  const inCategory = useMemo(
    () => (activeCategory ? products.filter((p) => p.categoryId === activeCategory._id) : products),
    [products, activeCategory]
  );

  const bounds = useMemo(() => {
    const prices = products.map((p) => p.price).filter((n) => typeof n === 'number');
    if (!prices.length) return { min: 0, max: 100 };
    return { min: Math.floor(Math.min(...prices)), max: Math.max(Math.ceil(Math.max(...prices)), 1) };
  }, [products]);

  const brandOptions = useMemo(() => {
    const counts = {};
    inCategory.forEach((p) => {
      if (p.brand) counts[p.brand] = (counts[p.brand] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [inCategory]);

  const filtered = useMemo(() => {
    const list = inCategory.filter((p) => {
      if (query) {
        const haystack = [p.name, p.brand, p.origin, p.shortDescription, p.description].join(' ').toLowerCase();
        if (!query.split(/\s+/).every((term) => haystack.includes(term))) return false;
      }
      if (filters.min !== null && p.price < filters.min) return false;
      if (filters.max !== null && p.price > filters.max) return false;
      if (filters.rating && (p.rating || 0) < filters.rating) return false;
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
      if (filters.inStock && !isAvailable(p)) return false;
      return true;
    });
    return [...list].sort(SORTERS[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inCategory, query, filters.min, filters.max, filters.rating, filters.brands.join('|'), filters.inStock, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from = filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(page * PAGE_SIZE, filtered.length);

  const chips = [];
  if (rawQuery.trim()) chips.push({ key: 'q', label: `Search: "${rawQuery.trim()}"`, clear: () => { setSearchQuery(''); updateParams({ q: '' }); } });
  if (filters.min !== null || filters.max !== null) {
    const label = filters.min !== null && filters.max !== null ? `$${filters.min} – $${filters.max}` : filters.min !== null ? `From $${filters.min}` : `Up to $${filters.max}`;
    chips.push({ key: 'price', label, clear: () => updateParams({ min: '', max: '' }) });
  }
  if (filters.rating) chips.push({ key: 'rating', label: `${filters.rating}★ & up`, clear: () => updateParams({ rating: '' }) });
  filters.brands.forEach((b) => chips.push({ key: `brand-${b}`, label: b, clear: () => updateParams({ brand: filters.brands.filter((x) => x !== b) }) }));
  if (filters.inStock) chips.push({ key: 'stock', label: 'In stock only', clear: () => updateParams({ stock: false }) });
  const hasActive = chips.length > 0;

  const goToPage = (n) => {
    updateParams({ page: n === 1 ? '' : String(n) });
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filterPanel = (
    <ShopFilters
      categories={categoryList}
      activeSlug={activeCategory?.slug || ''}
      categoryHref={categoryHref}
      totalCount={products.length}
      filters={filters}
      bounds={bounds}
      brandOptions={brandOptions}
      hasActive={hasActive}
      onChange={updateParams}
      onClear={clearFilters}
      onNavigate={() => setDrawerOpen(false)}
    />
  );

  // ---- Content states ---------------------------------------------------------
  const renderResults = () => {
    if (loading) return <LoadingSpinner label="Loading products..." />;
    if (error) {
      return (
        <EmptyState
          icon={<AlertIcon size={32} />}
          title="We couldn't load the products"
          message={error}
          action={{ label: 'Try again', onClick: reload }}
        />
      );
    }
    if (categoryMissing) {
      return <EmptyState title="Category not found" message="We couldn't find that category." action={{ label: 'View all products', to: '/shop' }} />;
    }
    if (products.length === 0) {
      return <EmptyState title="No products available yet" message="Please check back soon." action={{ label: 'Back to Home', to: '/' }} />;
    }
    if (filtered.length === 0) {
      return (
        <EmptyState
          title="No products match your filters"
          message="Try removing a filter or searching for something else."
          action={{ label: 'Clear all filters', onClick: clearFilters }}
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

  const title = activeCategory ? activeCategory.name : 'All Products';
  const ready = !loading && !error && !categoryMissing && products.length > 0;

  return (
    <div className="shop container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        {activeCategory ? <Link to="/shop">Shop</Link> : <span aria-current="page">Shop</span>}
        {activeCategory && (
          <>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{activeCategory.name}</span>
          </>
        )}
      </nav>

      <div className="shop-layout">
        <aside className="shop-sidebar" aria-label="Product filters">
          {ready ? filterPanel : null}
        </aside>

        <section className="shop-main" ref={resultsRef} aria-labelledby="shop-title">
          <div className="shop-toolbar">
            <div>
              <h1 id="shop-title" className="shop-title">
                {title}
              </h1>
              {!loading && !error && !categoryMissing && (
                <p className="shop-count" role="status" data-testid="product-count">
                  {filtered.length === 0
                    ? '0 products'
                    : `Showing ${from}\u2013${to} of ${filtered.length} products`}
                </p>
              )}
            </div>

            {ready && (
              <div className="shop-toolbar__controls">
                <button type="button" className="btn btn-outline filter-toggle" onClick={() => setDrawerOpen(true)}>
                  <FilterIcon size={16} /> Filters{chips.length ? ` (${chips.length})` : ''}
                </button>
                <label className="sort-select">
                  <span>Sort by</span>
                  <select value={sort} onChange={(e) => updateParams({ sort: e.target.value === 'popularity' ? '' : e.target.value })}>
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>

          {hasActive && ready && (
            <ul className="filter-chips" aria-label="Active filters">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button type="button" className="chip" onClick={chip.clear} aria-label={`Remove filter ${chip.label}`}>
                    {chip.label} <CloseIcon size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {renderResults()}
        </section>
      </div>

      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <div className="filter-drawer" role="dialog" aria-modal="true" aria-label="Product filters">
            <div className="filter-drawer__head">
              <strong>Filters</strong>
              <button type="button" className="icon-btn" aria-label="Close filters" onClick={() => setDrawerOpen(false)}>
                <CloseIcon size={22} />
              </button>
            </div>
            <div className="filter-drawer__body">{filterPanel}</div>
            <div className="filter-drawer__foot">
              <button type="button" className="btn btn-primary btn-block" onClick={() => setDrawerOpen(false)}>
                Show {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
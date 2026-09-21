import React, { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon } from './Icons';

const toNum = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const RATING_OPTIONS = [4, 3, 2];

// Filter panel shared by the desktop sidebar and the mobile drawer.
// filters: { min, max, rating, brands, inStock } ; onChange(patch) updates the URL.
export default function ShopFilters({
  categories,
  activeSlug,
  categoryHref,
  totalCount,
  filters,
  bounds,
  brandOptions,
  hasActive,
  onChange,
  onClear,
  onNavigate
}) {
  const groupId = useId();
  const [minVal, setMinVal] = useState(filters.min ?? '');
  const [maxVal, setMaxVal] = useState(filters.max ?? '');

  // Keep the inputs in sync when the URL changes (e.g. "Clear all")
  useEffect(() => {
    setMinVal(filters.min ?? '');
    setMaxVal(filters.max ?? '');
  }, [filters.min, filters.max]);

  // Apply typed prices shortly after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const min = toNum(minVal);
      const max = toNum(maxVal);
      if (min !== filters.min || max !== filters.max) {
        onChange({ min: min ?? '', max: max ?? '' }, { replace: true });
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minVal, maxVal]);

  const sliderValue = toNum(maxVal) ?? bounds.max;

  const toggleBrand = (brand) => {
    const next = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onChange({ brand: next });
  };

  return (
    <div className="filters">
      <div className="filters__head">
        <h2>Filters</h2>
        {hasActive && (
          <button type="button" className="filters__clear" onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <section className="filter-group" aria-labelledby="filter-cat">
          <h3 id="filter-cat">Categories</h3>
          <ul className="filter-cats">
            <li>
              <Link to={categoryHref('')} className={!activeSlug ? 'is-active' : ''} onClick={onNavigate}>
                <span>All Products</span>
                <span className="filter-count">{totalCount}</span>
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to={categoryHref(c.slug)} className={activeSlug === c.slug ? 'is-active' : ''} onClick={onNavigate}>
                  <span>{c.name}</span>
                  <span className="filter-count">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="filter-group" aria-labelledby="filter-price">
        <h3 id="filter-price">Price Range</h3>
        <div className="price-inputs">
          <label>
            <span className="sr-only">Minimum price</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder={`$${bounds.min}`}
              aria-label="Minimum price"
              value={minVal}
              onChange={(e) => setMinVal(e.target.value)}
            />
          </label>
          <span aria-hidden="true">&ndash;</span>
          <label>
            <span className="sr-only">Maximum price</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder={`$${bounds.max}`}
              aria-label="Maximum price"
              value={maxVal}
              onChange={(e) => setMaxVal(e.target.value)}
            />
          </label>
        </div>
        <input
          type="range"
          className="price-slider"
          aria-label="Maximum price slider"
          min={bounds.min}
          max={bounds.max}
          step="1"
          value={Math.min(Math.max(sliderValue, bounds.min), bounds.max)}
          onChange={(e) => setMaxVal(Number(e.target.value) >= bounds.max ? '' : e.target.value)}
        />
        <div className="price-range-labels">
          <span>${bounds.min}</span>
          <span>${bounds.max}</span>
        </div>
      </section>

      <section className="filter-group" aria-labelledby="filter-rating">
        <h3 id="filter-rating">Rating</h3>
        <ul className="filter-options">
          <li>
            <label>
              <input type="radio" name={`rating-${groupId}`} checked={!filters.rating} onChange={() => onChange({ rating: '' })} />
              <span>Any rating</span>
            </label>
          </li>
          {RATING_OPTIONS.map((r) => (
            <li key={r}>
              <label>
                <input type="radio" name={`rating-${groupId}`} checked={filters.rating === r} onChange={() => onChange({ rating: r })} />
                <span className="rating-option" aria-label={`${r} stars and up`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <StarIcon key={n} size={14} className={n <= r ? 'star-on' : 'star-off'} />
                  ))}
                  <span>&amp; up</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      {brandOptions.length > 1 && (
        <section className="filter-group" aria-labelledby="filter-brand">
          <h3 id="filter-brand">Brand</h3>
          <ul className="filter-options">
            {brandOptions.map((b) => (
              <li key={b.name}>
                <label>
                  <input type="checkbox" checked={filters.brands.includes(b.name)} onChange={() => toggleBrand(b.name)} />
                  <span>{b.name}</span>
                  <span className="filter-count">{b.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="filter-group" aria-labelledby="filter-stock">
        <h3 id="filter-stock">Availability</h3>
        <ul className="filter-options">
          <li>
            <label>
              <input type="checkbox" checked={filters.inStock} onChange={(e) => onChange({ stock: e.target.checked })} />
              <span>In stock only</span>
            </label>
          </li>
        </ul>
      </section>
    </div>
  );
}
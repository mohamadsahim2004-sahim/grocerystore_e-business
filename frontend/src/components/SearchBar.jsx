import React, { useId } from 'react';
import { SearchIcon } from './Icons';

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search for products...',
  className = ''
}) {
  const inputId = useId();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(value);
  };

  return (
    <form className={`search-bar ${className}`.trim()} role="search" onSubmit={handleSubmit}>
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <input
        id={inputId}
        type="search"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="submit" className="search-bar__submit" aria-label="Search">
        <SearchIcon size={18} />
      </button>
    </form>
  );
}
import React, { useContext, useState } from 'react';
import { StoreContext } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function ListingPage() {
  const { products, selectedCategory, setSelectedCategory, showOnlySpecials, setShowOnlySpecials, searchQuery } = useContext(StoreContext);
  const [sortOption, setSortOption] = useState('relevance');

  const categories = ['SPICES & BLENDS', 'EXOTIC FRUITS', 'WORLD GRAINS', 'GLOBAL SNACKS', 'FRESH HERBS', 'OTHERS'];

  let filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSpecials = showOnlySpecials ? p.isSpecial === true : true;
    return matchCat && matchSearch && matchSpecials;
  });

  if (sortOption === 'low-high') filtered.sort((a, b) => a.price - b.price);
  if (sortOption === 'high-low') filtered.sort((a, b) => b.price - a.price);

  return (
    <div>
      <div className="category-strip">
        <span>CATEGORIES:</span>
        <button className={selectedCategory === 'ALL' && !showOnlySpecials ? 'active' : ''} onClick={() => { setSelectedCategory('ALL'); setShowOnlySpecials(false); }}>
          ALL
        </button>
        {categories.map((cat) => (
          <button key={cat} className={selectedCategory === cat && !showOnlySpecials ? 'active' : ''} onClick={() => { setSelectedCategory(cat); setShowOnlySpecials(false); }}>
            {cat}
          </button>
        ))}
      </div>

      <div className="container">
        {showOnlySpecials && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>🔥 Showing Exclusive Limited-Time Offers & Discounted Products Only</span>
            <button style={{ fontSize: '12px', textDecoration: 'underline', color: '#991b1b', fontWeight: 'bold' }} onClick={() => setShowOnlySpecials(false)}>
              Show All Products
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>Sort by:</span>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px' }}>
            <option value="relevance">Relevance</option>
            <option value="low-high">Price: Low-High</option>
            <option value="high-low">Price: High-Low</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#777' }}>
            No products found matching your current filter.
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
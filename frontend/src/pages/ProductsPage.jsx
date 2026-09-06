import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function ProductsPage() {
  const {
    products,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showOnlySpecials,
    setShowOnlySpecials
  } = useContext(StoreContext);

  const categories = [
    'ALL',
    'Fruits',
    'Vegetables & Herbs',
    'Spices',
    'Beverages',
    'Sauces & Condiments',
    'Grains & Pantry',
    'Snacks & Sweets'
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSpecial = !showOnlySpecials || p.isSpecial;
    return matchesSearch && matchesCategory && matchesSpecial;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
      {/* Page Heading */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}>
            {showOnlySpecials ? '🔥 Weekly Special Offers' : 'Fresh Exotic Grocery Catalog'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Showing {filteredProducts.length} of {products.length} products
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              padding: '6px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Clear Search ✕
          </button>
        )}
      </div>

      {/* Category Filter Pills & Special Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px', background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-glass)',
                background: selectedCategory === cat ? 'var(--neon-green-bright)' : 'var(--bg-input)',
                color: selectedCategory === cat ? '#000' : 'var(--text-primary)',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          <input
            type="checkbox"
            checked={showOnlySpecials}
            onChange={(e) => setShowOnlySpecials(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          🔥 Specials Only
        </label>
      </div>

      {/* Product List Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0' }}>No products match your filter</h3>
          <p style={{ fontSize: '13px', margin: 0 }}>Try clearing your search query or selecting another category.</p>
          <button
            className="add-to-cart-btn"
            style={{ width: 'auto', marginTop: '16px', padding: '8px 16px' }}
            onClick={() => {
              setSelectedCategory('ALL');
              setShowOnlySpecials(false);
              setSearchQuery('');
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
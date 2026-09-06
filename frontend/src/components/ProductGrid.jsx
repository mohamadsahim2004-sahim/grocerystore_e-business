import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import ProductCard from './ProductCard';

export default function ProductGrid() {
  const { products, searchQuery, selectedCategory, showOnlySpecials, setSelectedCategory } = useContext(StoreContext);

  const categories = ['ALL', 'Fruits', 'Spices', 'Beverages'];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSpecial = !showOnlySpecials || p.isSpecial;
    return matchesSearch && matchesCategory && matchesSpecial;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glass)',
              background: selectedCategory === cat ? 'var(--neon-green-bright)' : 'var(--bg-surface)',
              color: selectedCategory === cat ? '#000' : 'var(--text-primary)',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No products found matching your criteria.
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
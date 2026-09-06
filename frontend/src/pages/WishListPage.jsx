import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function WishlistPage() {
  const { wishlist, setCurrentPage } = useContext(StoreContext);

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>
          ❤️ My Favorite Products ({wishlist.length})
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          Saved items to quickly review or add to your basket later.
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤍</div>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Your wishlist is empty</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Click the heart icon on any product to save it here.</p>
          <button className="add-to-cart-btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setCurrentPage('products')}>
            Explore Catalog
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function WishlistModal() {
  const { isWishlistOpen, setIsWishlistOpen, wishlist, toggleWishlist, addToCart, formatPrice } = useContext(StoreContext);

  if (!isWishlistOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsWishlistOpen(false)}>
      <div className="modal-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            ❤️ My Wishlist ({wishlist.length})
          </h2>
          <button style={{ fontSize: '18px', fontWeight: 'bold', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsWishlistOpen(false)}>
            ✕
          </button>
        </div>

        {wishlist.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Your wishlist is currently empty.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
            {wishlist.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</h4>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--neon-green-bright)' }}>{formatPrice(item.price)}</div>
                </div>
                <button
                  className="add-to-cart-btn"
                  style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                  onClick={() => {
                    addToCart(item);
                    toggleWishlist(item);
                  }}
                >
                  + Cart
                </button>
                <button style={{ color: '#d9534f', fontSize: '14px', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => toggleWishlist(item)}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
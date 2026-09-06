import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function CartModal() {
  const { isCartOpen, setIsCartOpen, cart, updateQuantity, formatPrice, setCurrentPage } = useContext(StoreContext);

  if (!isCartOpen) return null;

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="modal-card" style={{ maxWidth: '480px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            🛒 Shopping Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
          </h2>
          <button style={{ fontSize: '18px', fontWeight: 'bold', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsCartOpen(false)}>
            ✕
          </button>
        </div>

        {cart.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Your cart is empty.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
              {cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                  <img src={item.image} alt={item.name} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</h4>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--neon-green-bright)' }}>{formatPrice(item.price)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '2px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>-</button>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '2px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px', marginBottom: '16px', borderTop: '1px solid var(--border-glass)', paddingTop: '10px', color: 'var(--text-primary)' }}>
              <span>Total:</span>
              <span style={{ color: 'var(--neon-green-bright)' }}>{formatPrice(total)}</span>
            </div>

            <button
              className="add-to-cart-btn"
              style={{ width: '100%', padding: '12px', textAlign: 'center', fontSize: '13px' }}
              onClick={() => {
                setIsCartOpen(false);
                setCurrentPage('cart');
              }}
            >
              Proceed to Full Checkout ➔
            </button>
          </>
        )}
      </div>
    </div>
  );
}
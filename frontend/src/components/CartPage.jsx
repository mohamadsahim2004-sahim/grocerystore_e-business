import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function CartPage() {
  const { cart, updateQuantity, formatPrice, setCurrentPage, setCart } = useContext(StoreContext);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    alert('Thank you for your order! Order placed successfully.');
    setCart([]);
    setCurrentPage('home');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', padding: '20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
      <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
        🛒 Full Cart &amp; Checkout
      </h1>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <p>Your shopping cart is currently empty.</p>
          <button className="add-to-cart-btn" style={{ width: 'auto', marginTop: '12px', padding: '8px 16px' }} onClick={() => setCurrentPage('products')}>
            Browse Products
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {cart.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{item.name}</h3>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--neon-green-bright)' }}>{formatPrice(item.price)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '4px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '4px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Total Order Value:</span>
            <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--neon-green-bright)' }}>{formatPrice(total)}</span>
          </div>

          <button className="add-to-cart-btn" style={{ marginTop: '20px', padding: '14px', fontSize: '15px' }} onClick={handleCheckout}>
            Complete Order Now
          </button>
        </div>
      )}
    </div>
  );
}
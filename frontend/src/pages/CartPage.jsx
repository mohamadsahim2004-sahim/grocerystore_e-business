import React, { useContext, useState } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function CartPage() {
  const { cart, updateQuantity, formatPrice, setCurrentPage, setCart } = useContext(StoreContext);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal > 49 || cart.length === 0 ? 0 : 4.90;
  const discountedSubtotal = subtotal * (1 - discount);
  const finalTotal = discountedSubtotal + shippingCost;

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'EXOTIC10') {
      setDiscount(0.10);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try "EXOTIC10" for 10% off.');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
        🛒 Shopping Cart &amp; Summary
      </h1>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Look through our fresh catalog to add exotic items.</p>
          <button className="add-to-cart-btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setCurrentPage('products')}>
            Browse Catalog
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-glass)'
                }}
              >
                <img src={item.image} alt={item.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{item.name}</h3>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--neon-green-bright)' }}>{formatPrice(item.price)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '4px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '4px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Side Card */}
          <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', height: 'fit-content' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
              Order Breakdown
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{formatPrice(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--neon-green-bright)', fontWeight: 'bold' }}>
                  <span>Discount (10%):</span>
                  <span>-{formatPrice(subtotal * discount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Shipping (Germany):</span>
                <span>{shippingCost === 0 ? <strong style={{ color: 'var(--neon-green-bright)' }}>FREE</strong> : formatPrice(shippingCost)}</span>
              </div>
            </div>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="form-control"
                  placeholder="Promo code (e.g. EXOTIC10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  style={{ flex: 1, fontSize: '12px' }}
                />
                <button type="submit" style={{ padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                  Apply
                </button>
              </div>
              {promoError && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{promoError}</div>}
              {discount > 0 && <div style={{ color: 'var(--neon-green-bright)', fontSize: '11px', marginTop: '4px' }}>✓ 10% Coupon EXOTIC10 applied!</div>}
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '20px' }}>
              <span>Total:</span>
              <span style={{ color: 'var(--neon-green-bright)' }}>{formatPrice(finalTotal)}</span>
            </div>

            <button
              className="add-to-cart-btn"
              style={{ padding: '14px', fontSize: '14px' }}
              onClick={() => setCurrentPage('checkout')}
            >
              Proceed to Checkout ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
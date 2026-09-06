import React, { useContext, useState } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function CheckoutPage() {
  const { cart, user, formatPrice, setCurrentPage, setCart } = useContext(StoreContext);

  const [shippingInfo, setShippingInfo] = useState({
    name: user.name || '',
    email: user.email || '',
    street: user.street || '',
    city: user.city || '',
    zip: user.zip || '',
    country: 'Germany'
  });

  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [orderComplete, setOrderComplete] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal > 49 || cart.length === 0 ? 0 : 4.90;
  const grandTotal = subtotal + shippingCost;

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    setOrderComplete(true);
    setCart([]);
  };

  if (orderComplete) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '32px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 8px 0', fontFamily: 'var(--font-heading)' }}>
          Order Confirmed!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
          Thank you, <strong style={{ color: 'var(--text-primary)' }}>{shippingInfo.name}</strong>. Your order has been placed successfully and a confirmation email was dispatched to <strong style={{ color: 'var(--text-primary)' }}>{shippingInfo.email}</strong>.
        </p>
        <button className="add-to-cart-btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setCurrentPage('home')}>
          Return to Home Page
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px' }}>
      <button
        onClick={() => setCurrentPage('cart')}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '16px', fontSize: '13px', fontWeight: 'bold' }}
      >
        ← Back to Shopping Cart
      </button>

      <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>
        🔒 Express Checkout
      </h1>

      <form onSubmit={handleSubmitOrder} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Delivery Details */}
        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
            1. Shipping Address
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Full Name</label>
              <input className="form-control" value={shippingInfo.name} onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Email Address</label>
              <input className="form-control" type="email" value={shippingInfo.email} onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Street &amp; House No.</label>
              <input className="form-control" value={shippingInfo.street} onChange={(e) => setShippingInfo({ ...shippingInfo, street: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>City</label>
                <input className="form-control" value={shippingInfo.city} onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })} required />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Postal Code</label>
                <input className="form-control" value={shippingInfo.zip} onChange={(e) => setShippingInfo({ ...shippingInfo, zip: e.target.value })} required />
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Final Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
              2. Payment Method
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { id: 'paypal', label: 'PayPal / Express Checkout' },
                { id: 'klarna', label: 'Klarna (Pay in 30 Days)' },
                { id: 'card', label: 'Credit Card (Visa / Mastercard)' },
                { id: 'sepa', label: 'SEPA Direct Debit' }
              ].map((m) => (
                <label
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: paymentMethod === m.id ? 'var(--bg-input)' : 'transparent',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-glass)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)'
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
              <span>Total Payment:</span>
              <span style={{ color: 'var(--neon-green-bright)' }}>{formatPrice(grandTotal)}</span>
            </div>
            <button type="submit" className="add-to-cart-btn" style={{ padding: '14px', fontSize: '14px' }}>
              Confirm &amp; Pay Order ➔
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
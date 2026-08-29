import React from 'react';

export default function ShippingPage() {
  return (
    <main className="section" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="section-title">Shipping Info (Germany)</h1>
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-dark)', lineHeight: '1.7', color: '#cbd5e1' }}>
        <h3 style={{ color: '#fff', marginBottom: '12px' }}>Domestic Delivery Details</h3>
        <p style={{ marginBottom: '16px' }}>
          We deliver to all addresses across Germany using <strong>DHL Express</strong> and <strong>DHL Standard</strong> services.
        </p>

        <h4 style={{ color: 'var(--leaf-green-glow)', margin: '16px 0 8px' }}>Shipping Rates:</h4>
        <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
          <li>Standard Shipping (1-3 Days): €4.99</li>
          <li>Express Shipping (Next Day): €9.99</li>
          <li><strong>Free Shipping</strong> on all orders over €50.00!</li>
        </ul>

        <h4 style={{ color: 'var(--leaf-green-glow)', margin: '16px 0 8px' }}>Chilled Goods:</h4>
        <p>
          Fresh fruits, vegetables, and roots are shipped Monday through Thursday to prevent weekend transit delays.
        </p>
      </div>
    </main>
  );
}
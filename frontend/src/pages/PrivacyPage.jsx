import React from 'react';

export default function PrivacyPage() {
  return (
    <main className="section" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="section-title">Privacy Policy (Datenschutz)</h1>
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-dark)', lineHeight: '1.7', color: '#cbd5e1' }}>
        <h3 style={{ color: '#fff', marginBottom: '10px' }}>1. Data Protection Overview</h3>
        <p style={{ marginBottom: '16px' }}>
          We take your personal privacy seriously. This privacy policy explains how we collect, use, and protect your data when visiting our online grocery store.
        </p>

        <h3 style={{ color: '#fff', marginBottom: '10px' }}>2. Data Collection on Our Website</h3>
        <p style={{ marginBottom: '16px' }}>
          Personal data is collected when you place an order, create an account, or contact us. This includes your name, delivery address, email, and payment details required for order processing.
        </p>

        <h3 style={{ color: '#fff', marginBottom: '10px' }}>3. Your Rights (GDPR / DSGVO)</h3>
        <p>
          You have the right to request information about your stored personal data, its origin, recipients, and purpose of processing at any time free of charge. You also have the right to request deletion or correction.
        </p>
      </div>
    </main>
  );
}
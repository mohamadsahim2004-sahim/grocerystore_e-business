import React, { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="section" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="section-title center">Contact Us</h1>
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-dark)' }}>
        {submitted ? (
          <div style={{ textAlign: 'center', color: 'var(--leaf-green-glow)', padding: '20px' }}>
            <h2>Thank You!</h2>
            <p style={{ marginTop: '8px', color: '#cbd5e1' }}>Your message has been received. We will get back to you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Name</label>
              <input type="text" required className="search-input" style={{ width: '100%', borderRadius: '6px' }} placeholder="Your name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Email</label>
              <input type="email" required className="search-input" style={{ width: '100%', borderRadius: '6px' }} placeholder="Your email address" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Message</label>
              <textarea required className="search-input" style={{ width: '100%', height: '100px', borderRadius: '6px', resize: 'vertical' }} placeholder="How can we help you?"></textarea>
            </div>
            <button type="submit" className="checkout-btn" style={{ marginTop: '10px' }}>Send Message</button>
          </form>
        )}
      </div>
    </main>
  );
}
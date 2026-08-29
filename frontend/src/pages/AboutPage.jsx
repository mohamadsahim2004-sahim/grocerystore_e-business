import React from 'react';

export default function AboutPage() {
  return (
    <main className="section" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="section-title center">About EXOTIC Food Markt</h1>
      <div style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: '8px', border: '1px solid var(--border-dark)', lineHeight: '1.8', color: '#cbd5e1' }}>
        <p style={{ marginBottom: '16px' }}>
          Welcome to <strong>EXOTIC Food Markt</strong>! We are dedicated to bringing authentic, world-class ingredients straight to kitchen tables across Germany.
        </p>
        <p style={{ marginBottom: '16px' }}>
          Whether you are looking for rare spices, premium saffron, fresh roots, or traditional global snacks, we source top-tier products directly from authentic growers and producers around the globe.
        </p>
        <p>
          Our mission is simple: provide fresh quality, reliable fast shipping, and an unmatched range of global food culture.
        </p>
      </div>
    </main>
  );
}
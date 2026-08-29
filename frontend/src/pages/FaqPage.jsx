import React from 'react';

export default function FaqPage() {
  const faqs = [
    {
      q: 'How long does delivery take within Germany?',
      a: 'Standard shipping usually takes 1 to 3 business days via DHL.'
    },
    {
      q: 'Are fresh fruits and herbs safely packaged?',
      a: 'Yes, all fresh products are packed in eco-friendly temperature-regulated containers with cooling packs.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept PayPal, Credit Cards (Visa, MasterCard), Klarna, and SEPA bank transfers.'
    },
    {
      q: 'Can I track my package?',
      a: 'Once your order is dispatched, a tracking code will be sent to your email address.'
    }
  ];

  return (
    <main className="section" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="section-title">Frequently Asked Questions</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {faqs.map((faq, index) => (
          <div key={index} style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-dark)' }}>
            <h3 style={{ color: 'var(--leaf-green-glow)', marginBottom: '8px' }}>{faq.q}</h3>
            <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>{faq.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
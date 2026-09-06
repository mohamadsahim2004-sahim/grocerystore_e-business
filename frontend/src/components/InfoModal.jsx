import React, { useContext, useState } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function InfoModal() {
  const { infoModal, setInfoModal } = useContext(StoreContext);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  if (!infoModal) return null;

  const renderContent = () => {
    switch (infoModal) {
      case 'faq':
        return (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              ❓ Frequently Asked Questions (FAQ)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', lineHeight: '1.5' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>How are fresh exotic items packed?</strong>
                <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>All fresh fruits and roots are stored in temperature-controlled packaging with eco-friendly cooling elements.</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>What payment methods do you accept?</strong>
                <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>We accept PayPal, Klarna (Pay Later / Slice It), SEPA Direct Debit, Apple Pay, and Visa/Mastercard.</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Can I return perishable items?</strong>
                <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Due to German hygiene regulations, fresh grocery items are exempt from standard statutory withdrawal, but defective items are fully refunded.</p>
              </div>
            </div>
          </div>
        );

      case 'shipping':
        return (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              📦 Shipping &amp; Delivery (Germany)
            </h2>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              <p>We deliver anywhere within Germany using <strong style={{ color: 'var(--text-primary)' }}>DHL GoGreen</strong> and <strong style={{ color: 'var(--text-primary)' }}>Hermes</strong>.</p>
              <table style={{ width: '100%', margin: '12px 0', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-glass)', color: 'var(--text-primary)' }}>
                    <th style={{ padding: '6px' }}>Option</th>
                    <th style={{ padding: '6px' }}>Delivery Time</th>
                    <th style={{ padding: '6px' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '6px' }}>Standard DHL</td>
                    <td style={{ padding: '6px' }}>1–3 Business Days</td>
                    <td style={{ padding: '6px' }}>€4.90 (Free over €49)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '6px' }}>Express Cool-Pack</td>
                    <td style={{ padding: '6px' }}>Next Day (by 12:00)</td>
                    <td style={{ padding: '6px' }}>€8.90</td>
                  </tr>
                </tbody>
              </table>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>* All shipping prices include statutory German VAT (19%).</p>
            </div>
          </div>
        );

      case 'impressum':
        return (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              ⚖️ Impressum (Legal Notice)
            </h2>
            <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              <p>Information pursuant to § 5 Digital Services Act (DDG / TMG):</p>
              <br />
              <strong style={{ color: 'var(--text-primary)' }}>Exotic Grocery Store GmbH</strong><br />
              Friedrichstraße 42<br />
              10117 Berlin, Germany<br /><br />
              <strong style={{ color: 'var(--text-primary)' }}>Represented by:</strong> Managing Director Alex Morgan<br />
              <strong style={{ color: 'var(--text-primary)' }}>Commercial Register:</strong> Amtsgericht Berlin-Charlottenburg, HRB 298102 B<br />
              <strong style={{ color: 'var(--text-primary)' }}>VAT ID Number (USt-IdNr.):</strong> DE 318 902 114<br /><br />
              <strong style={{ color: 'var(--text-primary)' }}>Contact:</strong><br />
              Phone: +49 (0) 30 12345678<br />
              Email: support@exoticgroceries.de
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              🔒 Privacy Policy (DSGVO)
            </h2>
            <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)', maxHeight: '280px', overflowY: 'auto' }}>
              <p><strong style={{ color: 'var(--text-primary)' }}>1. Data Protection Overview</strong><br />We take the protection of your personal data very seriously in compliance with the EU General Data Protection Regulation (GDPR / DSGVO).</p>
              <br />
              <p><strong style={{ color: 'var(--text-primary)' }}>2. Data Collection on Our Website</strong><br />Data is collected when you place an order or fill out our contact form. This includes name, address, payment details, and IP address for session security.</p>
              <br />
              <p><strong style={{ color: 'var(--text-primary)' }}>3. Your Rights (Art. 15-21 DSGVO)</strong><br />You have the right to request access, rectification, deletion, or restriction of processing of your stored personal data at any time free of charge.</p>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              ✉️ Contact Us
            </h2>
            {contactSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--neon-green-bright)', fontWeight: 'bold' }}>
                ✅ Thank you! Your message has been sent to support@exoticgroceries.de.
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setContactSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input className="form-control" type="text" placeholder="Your Name" required />
                <input className="form-control" type="email" placeholder="Your Email (e.g. name@domain.de)" required />
                <textarea className="form-control" rows="3" placeholder="How can we help you?" required></textarea>
                <button type="submit" className="add-to-cart-btn" style={{ height: '40px', marginTop: '6px' }}>Send Message</button>
              </form>
            )}
          </div>
        );

      case 'about':
        return (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              🌱 About Our Store
            </h2>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              <p>Founded in Berlin, our mission is to bring high-quality, authentic, and exotic organic spices, tropical fruits, and specialty culinary ingredients straight to your doorstep across Germany.</p>
              <br />
              <p>We partner directly with sustainable smallholder farms worldwide to ensure freshness, fair trade practices, and authentic flavors.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={() => { setInfoModal(null); setContactSubmitted(false); }}>
      <div className="modal-card" style={{ maxWidth: '520px', position: 'relative', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)' }} onClick={(e) => e.stopPropagation()}>
        <button
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}
          onClick={() => { setInfoModal(null); setContactSubmitted(false); }}
        >
          ✕
        </button>
        {renderContent()}
      </div>
    </div>
  );
}
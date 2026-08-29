import React from 'react';

export default function ImpressumPage() {
  return (
    <main className="section" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="section-title">Impressum</h1>
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-dark)', lineHeight: '1.8', color: '#cbd5e1' }}>
        <h3 style={{ color: '#fff' }}>Angaben gemäß § 5 TMG</h3>
        <p>
          EXOTIC Food Markt GmbH<br />
          Karl-Liebknecht-Straße 10<br />
          10178 Berlin, Germany
        </p>

        <h4 style={{ color: 'var(--leaf-green-glow)', marginTop: '16px' }}>Vertreten durch:</h4>
        <p>Managing Director: Max Mustermann</p>

        <h4 style={{ color: 'var(--leaf-green-glow)', marginTop: '16px' }}>Kontakt:</h4>
        <p>
          Telefon: +49 (0) 30 12345678<br />
          E-Mail: info@exoticgrocery.de
        </p>

        <h4 style={{ color: 'var(--leaf-green-glow)', marginTop: '16px' }}>Umsatzsteuer-ID:</h4>
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: DE 987654321</p>
      </div>
    </main>
  );
}
import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function Footer() {
  const { setInfoModal } = useContext(StoreContext);

  return (
    <footer className="site-footer" style={{ padding: '24px 0', borderTop: '1px solid var(--border-glass)', marginTop: '40px', background: 'var(--bg-surface)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', fontSize: '12px', fontWeight: 'bold' }}>
        <button onClick={() => setInfoModal('faq')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>FAQ</button>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <button onClick={() => setInfoModal('shipping')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>SHIPPING INFO (GERMANY)</button>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <button onClick={() => setInfoModal('impressum')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>IMPRESSUM</button>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <button onClick={() => setInfoModal('privacy')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>PRIVACY POLICY</button>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <button onClick={() => setInfoModal('contact')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>CONTACT</button>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <button onClick={() => setInfoModal('about')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>ABOUT</button>
      </div>
      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} Exotic Grocery Store GmbH. All rights reserved.
      </div>
    </footer>
  );
}
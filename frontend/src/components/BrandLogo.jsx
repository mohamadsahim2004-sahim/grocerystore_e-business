import React from 'react';

export default function BrandLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}>
      <div style={{ width: '46px', height: '46px', position: 'relative' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.8))' }}>
          <path d="M 20 25 C 50 5 90 20 85 45 C 60 45 35 35 20 25 Z" fill="#ffffff" />
          <path d="M 30 38 C 65 25 80 45 70 65 C 50 65 35 55 30 38 Z" fill="#22c55e" />
          <path d="M 33 48 Q 50 48 67 48" stroke="#15803d" strokeWidth="3" fill="none" />
          <path d="M 45 48 L 55 40 M 52 48 L 62 56" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 35 72 C 60 72 80 65 75 78 C 55 82 35 80 35 72 Z" fill="#ffffff" />
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{
          fontSize: '24px',
          fontWeight: '900',
          letterSpacing: '2.5px',
          color: 'var(--text-primary)',
          textShadow: '0 0 10px rgba(255,255,255,0.4), 0 0 20px rgba(34, 197, 94, 0.4)',
          fontFamily: 'var(--font-heading)',
          lineHeight: '1'
        }}>
          EXOTIC
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '3px 0' }}>
          <span style={{ height: '1px', background: 'var(--border-glass)', flex: 1 }}></span>
          <span style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: '600', whiteSpace: 'nowrap' }}>
            Authentic &amp; Global Flavors
          </span>
          <span style={{ height: '1px', background: 'var(--border-glass)', flex: 1 }}></span>
        </div>

        <span style={{
          fontSize: '15px',
          fontWeight: '800',
          color: 'var(--text-primary)',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          lineHeight: '1',
          textShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
        }}>
          🛒 Food Markt
        </span>
      </div>
    </div>
  );
}
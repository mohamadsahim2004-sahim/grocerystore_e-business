import React from 'react';

// Exact Leaf Emblem SVG matching the sign logo
export const ExoticLeafEmblem = ({ width = 50, height = 50 }) => (
  <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* White glowing framing arcs */}
    <path d="M22 45 C20 18, 62 12, 85 20 C62 22, 34 32, 28 54 C26 62, 28 72, 36 78 C24 70, 21 58, 22 45 Z" fill="#FFFFFF" />
    <path d="M36 82 C52 83, 72 78, 88 68 C68 70, 48 76, 36 82 Z" fill="#FFFFFF" />
    <path d="M60 42 L82 42 L72 50 Z" fill="#FFFFFF" />

    {/* Green Leaf Center */}
    <path d="M30 52 C35 28, 70 25, 82 30 C70 45, 52 65, 32 58 Z" fill="url(#leafGradient)" />
    
    {/* Leaf Veins */}
    <path d="M33 55 Q55 42 78 32" stroke="#14532d" strokeWidth="2" strokeLinecap="round" />
    <path d="M45 49 Q52 42 58 40" stroke="#14532d" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M55 44 Q62 38 68 36" stroke="#14532d" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M42 52 Q46 56 50 58" stroke="#14532d" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M52 47 Q57 52 62 54" stroke="#14532d" strokeWidth="1.5" strokeLinecap="round" />

    <defs>
      <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
    </defs>
  </svg>
);

// Brand Logo Component matching exact image text & slogan
export const BrandLogo = ({ layout = "inline" }) => {
  if (layout === "vertical") {
    return (
      <div className="brand-logo-container vertical" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <ExoticLeafEmblem width={65} height={65} />
        <span style={{ fontSize: '28px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '3px', lineHeight: '1', marginTop: '6px' }}>
          EXOTIC
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0', width: '100%', maxWidth: '240px' }}>
          <span style={{ flex: 1, height: '1px', backgroundColor: '#64748b' }}></span>
          <span style={{ fontSize: '11px', color: '#ffffff', letterSpacing: '0.5px', fontWeight: '600', whiteSpace: 'nowrap' }}>
            Authentic & Global Flavors
          </span>
          <span style={{ flex: 1, height: '1px', backgroundColor: '#64748b' }}></span>
        </div>
        <span style={{ fontSize: '20px', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🛒 Food Markt
        </span>
      </div>
    );
  }

  return (
    <div className="brand-logo-container inline" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
      <ExoticLeafEmblem width={46} height={46} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
        <span style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '2px' }}>
          EXOTIC
        </span>
        <span style={{ fontSize: '9px', color: '#4ade80', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '2px 0' }}>
          — Authentic & Global Flavors —
        </span>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
          🛒 Food Markt
        </span>
      </div>
    </div>
  );
};

// Payment Logos
export const VisaLogo = () => (
  <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
    <rect width="38" height="24" rx="4" fill="#1434CB"/>
    <path d="M14.9 16.5L16.8 7.5H19.2L17.3 16.5H14.9ZM25.2 7.7C24.7 7.5 24 7.3 23.1 7.3C20.6 7.3 18.9 8.6 18.9 10.4C18.9 11.8 20.2 12.5 21.1 13C22 13.5 22.3 13.8 22.3 14.2C22.3 14.8 21.6 15.1 20.9 15.1C19.9 15.1 19.3 14.9 18.6 14.6L18.2 16.4C18.9 16.7 20 16.9 21.1 16.9C23.8 16.9 25.5 15.6 25.5 13.7C25.5 11.5 22.4 11.3 22.4 10.3C22.4 10 22.8 9.6 23.6 9.6C24.2 9.6 24.8 9.7 25.3 10L25.2 7.7ZM31 7.5H29.1C28.5 7.5 28 7.7 27.8 8.2L24.3 16.5H26.8L27.3 15.1H30.4L30.7 16.5H33L31 7.5ZM28 13.2L29.3 9.7L30.1 13.2H28ZM13.8 7.5L11.5 13.7L11.2 12.2C10.7 10.5 9.1 8.5 7.3 7.5L9.4 16.5H11.9L15.9 7.5H13.8Z" fill="white"/>
  </svg>
);

export const MastercardLogo = () => (
  <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
    <rect width="38" height="24" rx="4" fill="#1A1F2C"/>
    <circle cx="15" cy="12" r="7" fill="#EB001B"/>
    <circle cx="23" cy="12" r="7" fill="#F79E1B" fillOpacity="0.8"/>
  </svg>
);

export const PaypalLogo = () => (
  <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
    <rect width="38" height="24" rx="4" fill="#003087"/>
    <path d="M14 6H19C21 6 22 7 21.8 8.5C21.5 10.3 20 11.5 18 11.5H15.5L14.7 16.5H12.5L14 6Z" fill="#0079C1"/>
    <path d="M16 8H21C22.8 8 23.8 9 23.5 10.5C23.1 12.5 21.5 13.5 19.5 13.5H17.2L16.3 19H14.2L16 8Z" fill="#00457C"/>
  </svg>
);

export const ApplePayLogo = () => (
  <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
    <rect width="38" height="24" rx="4" fill="#000000"/>
    <path d="M14.2 11.4C14.2 10.2 15 9.5 15.8 9C15.3 8.3 14.5 7.9 13.6 7.9C12.4 7.8 11.3 8.6 10.7 8.6C10.1 8.6 9.1 7.9 8.1 8C6.9 8 5.7 8.7 5.1 9.8C3.8 12 5.4 15.3 6.7 17.2C7.3 18.1 8 19 8.9 19C9.8 19 10.1 18.4 11.2 18.4C12.3 18.4 12.6 19 13.5 19C14.4 19 15.1 18.1 15.7 17.2C16.4 16.2 16.7 15.2 16.7 15.1C16.6 15 14.2 14.1 14.2 11.4ZM12.7 6.6C13.2 6 13.5 5.1 13.4 4.2C12.6 4.2 11.6 4.7 11.1 5.4C10.6 5.9 10.2 6.8 10.3 7.7C11.2 7.8 12.2 7.2 12.7 6.6Z" fill="white"/>
    <text x="18" y="15" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Pay</text>
  </svg>
);

// Social Media Logos
export const InstagramLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export const FacebookLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

export const TwitterLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);
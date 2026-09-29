import React from 'react';
import { Link } from 'react-router-dom';

import wordmark from '../assets/logo/exotic-wordmark.png';
import wordmarkWhite from '../assets/logo/exotic-wordmark-white.png';
import logoFull from '../assets/logo/exotic-logo.png';
import logoFullWhite from '../assets/logo/exotic-logo-white.png';

const SOURCES = {
  wordmark: {
    light: wordmark,
    dark: wordmarkWhite,
    maxWidth: '190px',
    aspect: '480/158',
  },

  full: {
    light: logoFull,
    dark: logoFullWhite,
    maxWidth: '230px',
    aspect: '480/390',
  },
};

export default function BrandLogo({
  variant = 'wordmark',
  tone = 'light',
  className = '',
  onClick,
}) {
  const source = SOURCES[variant] || SOURCES.wordmark;
  const imageAsset = source[tone] || source.light;

  return (
    <Link
      to="/"
      onClick={onClick}
      className={`brand-logo brand-logo--${variant} brand-logo--${tone} ${className}`.trim()}
      aria-label="EXOTIC Food Market - Home"
    >
      <img
        src={imageAsset}
        alt="EXOTIC Food Market"
        className="brand-logo__image"
        style={{
          aspectRatio: source.aspect,
        }}
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    </Link>
  );
}
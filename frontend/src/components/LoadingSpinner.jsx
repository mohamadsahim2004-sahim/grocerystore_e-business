import React from 'react';

// size: 'sm' | 'md' | 'lg'   fullPage: centre in the viewport area   label: accessible + visible text
export default function LoadingSpinner({ size = 'md', label = 'Loading...', fullPage = false, showLabel = true }) {
  return (
    <div className={`spinner-wrap${fullPage ? ' spinner-wrap--page' : ''}`} role="status" aria-live="polite">
      <span className={`spinner spinner--${size}`} aria-hidden="true" />
      {showLabel ? <span className="spinner-label">{label}</span> : <span className="sr-only">{label}</span>}
    </div>
  );
}
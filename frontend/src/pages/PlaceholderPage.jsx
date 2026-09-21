import React from 'react';
import EmptyState from '../components/EmptyState';

// Temporary landing for nav/footer routes whose pages are built in later phases.
export default function PlaceholderPage({ title }) {
  return (
    <div className="container page-section">
      <EmptyState
        title={title}
        message="This page is coming soon."
        action={{ label: 'Back to Home', to: '/' }}
      />
    </div>
  );
}
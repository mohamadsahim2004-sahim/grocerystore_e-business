import React from 'react';
import EmptyState from '../components/EmptyState';

// Temporary landing for nav/footer routes whose pages are built in later phases.
// `bare` skips the container/page-section wrapper for use inside a layout that already
// provides one (e.g. the account sidebar layout).
export default function PlaceholderPage({ title, bare = false }) {
  const content = (
    <EmptyState
      title={title}
      message="This page is coming soon."
      action={{ label: 'Back to Home', to: '/' }}
    />
  );

  return bare ? content : <div className="container page-section">{content}</div>;
}
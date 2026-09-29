import React from 'react';
import EmptyState from '../components/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="container page-section">
      <EmptyState
        title="Page not found"
        message="The page you are looking for doesn't exist or may have moved."
        action={{ label: 'Back to the store', to: '/' }}
      />
    </div>
  );
}
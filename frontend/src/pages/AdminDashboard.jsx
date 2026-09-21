import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/admin/dashboard')
      .then(({ data }) => {
        if (!cancelled) setMetrics(data.metrics);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Admin Dashboard</h2>
      </div>
      {error && <p className="error-msg" role="alert">{error}</p>}
      {!error && !metrics && <p>Loading metrics...</p>}
      {metrics && (
        <ul>
          <li>Total products: {metrics.totalProducts}</li>
          <li>Total users: {metrics.totalUsers}</li>
        </ul>
      )}
    </div>
  );
}
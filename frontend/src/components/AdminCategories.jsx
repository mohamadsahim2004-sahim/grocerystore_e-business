import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { AlertIcon } from '../components/Icons';

export default function AdminCategories() {
  const [state, setState] = useState({ status: 'loading', categories: [], error: '' });
  const [attempt, setAttempt] = useState(0);
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, status: 'loading' }));
    api
      .get('/admin/categories')
      .then(({ data }) => !cancelled && setState({ status: 'ready', categories: data, error: '' }))
      .catch((err) => !cancelled && setState({ status: 'error', categories: [], error: getErrorMessage(err, 'Could not load categories.') }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    setActionError('');
    setBusyId(category._id);
    try {
      await api.delete(`/admin/categories/${category._id}`);
      setState((prev) => ({ ...prev, categories: prev.categories.filter((c) => c._id !== category._id) }));
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not delete this category.'));
    } finally {
      setBusyId('');
    }
  };

  if (state.status === 'loading') return <LoadingSpinner size="lg" label="Loading categories..." />;
  if (state.status === 'error') {
    return <EmptyState icon={<AlertIcon size={32} />} title="We couldn't load categories" message={state.error} action={{ label: 'Try again', onClick: retry }} />;
  }

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1 className="page-title">Categories</h1>
        <Link to="/admin/categories/new" className="btn btn-primary">
          + New Category
        </Link>
      </div>

      {actionError && (
        <p className="error-msg" role="alert">
          {actionError}
        </p>
      )}

      {state.categories.length === 0 ? (
        <EmptyState title="No categories yet" message="Create your first category to start organizing products." action={{ label: 'New Category', to: '/admin/categories/new' }} />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th className="num">Products</th>
                <th>Status</th>
                <th className="admin-table__actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.categories.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td className="admin-muted">{c.slug}</td>
                  <td className="num">{c.productCount}</td>
                  <td>
                    <span className={`status-pill ${c.isActive !== false ? 'status-pill--delivered' : 'status-pill--cancelled'}`}>
                      {c.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/categories/${c._id}/edit`} className="btn btn-outline btn-sm">
                      Edit
                    </Link>
                    <button type="button" className="btn btn-outline btn-sm" disabled={busyId === c._id} onClick={() => handleDelete(c)}>
                      {busyId === c._id ? '...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
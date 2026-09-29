import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { AlertIcon, ImageIcon } from '../components/Icons';

export default function AdminProducts() {
  const [state, setState] = useState({ status: 'loading', products: [], error: '' });
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, status: 'loading' }));
    api
      .get('/admin/products')
      .then(({ data }) => !cancelled && setState({ status: 'ready', products: data, error: '' }))
      .catch((err) => !cancelled && setState({ status: 'error', products: [], error: getErrorMessage(err, 'Could not load products.') }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const categories = useMemo(() => {
    const map = new Map();
    state.products.forEach((p) => {
      if (p.category?._id) map.set(p.category._id, p.category.name);
    });
    return [...map.entries()];
  }, [state.products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.products.filter((p) => {
      if (categoryFilter && p.category?._id !== categoryFilter) return false;
      if (q && !`${p.name} ${p.slug}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [state.products, query, categoryFilter]);

  const toggleActive = async (product) => {
    setActionError('');
    setBusyId(product._id);
    try {
      if (product.isActive) {
        const { data } = await api.delete(`/admin/products/${product._id}`);
        setState((prev) => ({ ...prev, products: prev.products.map((p) => (p._id === product._id ? { ...p, isActive: data.isActive } : p)) }));
      } else {
        const { data } = await api.put(`/admin/products/${product._id}`, { isActive: true });
        setState((prev) => ({ ...prev, products: prev.products.map((p) => (p._id === product._id ? { ...p, isActive: data.isActive } : p)) }));
      }
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not update this product.'));
    } finally {
      setBusyId('');
    }
  };

  if (state.status === 'loading') return <LoadingSpinner size="lg" label="Loading products..." />;
  if (state.status === 'error') {
    return <EmptyState icon={<AlertIcon size={32} />} title="We couldn't load products" message={state.error} action={{ label: 'Try again', onClick: retry }} />;
  }

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1 className="page-title">Products</h1>
        <Link to="/admin/products/new" className="btn btn-primary">
          + New Product
        </Link>
      </div>

      <div className="admin-toolbar">
        <input
          type="search"
          className="form-control"
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="form-control" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {actionError && (
        <p className="error-msg" role="alert">
          {actionError}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState title="No products found" message="Try a different search or add a new product." action={{ label: 'New Product', to: '/admin/products/new' }} />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th className="num">Price</th>
                <th className="num">Stock</th>
                <th>Status</th>
                <th className="admin-table__actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="admin-cell-media">
                      <span className="admin-thumb">{p.image ? <img src={p.image} alt="" /> : <ImageIcon size={18} />}</span>
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td>{p.category?.name || '\u2014'}</td>
                  <td className="num">${p.price.toFixed(2)}</td>
                  <td className="num">{p.stock}</td>
                  <td>
                    <span className={`status-pill ${p.isActive ? 'status-pill--delivered' : 'status-pill--cancelled'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/products/${p._id}/edit`} className="btn btn-outline btn-sm">
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={busyId === p._id}
                      onClick={() => toggleActive(p)}
                    >
                      {busyId === p._id ? '...' : p.isActive ? 'Deactivate' : 'Activate'}
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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { AlertIcon, ImageIcon } from '../components/Icons';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'low', label: 'Low Stock' },
  { key: 'out', label: 'Out of Stock' }
];

export default function AdminInventory() {
  const [state, setState] = useState({ status: 'loading', items: [], error: '' });
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState('all');
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState('');
  const [rowError, setRowError] = useState({});

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, status: 'loading' }));
    api
      .get('/admin/inventory')
      .then(({ data }) => !cancelled && setState({ status: 'ready', items: data, error: '' }))
      .catch((err) => !cancelled && setState({ status: 'error', items: [], error: getErrorMessage(err, 'Could not load inventory.') }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const counts = useMemo(
    () => ({
      all: state.items.length,
      low: state.items.filter((i) => i.lowStock).length,
      out: state.items.filter((i) => i.outOfStock).length
    }),
    [state.items]
  );

  const filtered = useMemo(() => {
    if (filter === 'low') return state.items.filter((i) => i.lowStock);
    if (filter === 'out') return state.items.filter((i) => i.outOfStock);
    return state.items;
  }, [state.items, filter]);

  const handleSave = async (item) => {
    const raw = drafts[item._id];
    const stock = Number(raw);
    if (!Number.isInteger(stock) || stock < 0) {
      setRowError((prev) => ({ ...prev, [item._id]: 'Enter a whole number of 0 or more' }));
      return;
    }
    setRowError((prev) => ({ ...prev, [item._id]: '' }));
    setSavingId(item._id);
    try {
      const { data } = await api.patch(`/admin/inventory/${item._id}`, { stock });
      setState((prev) => ({ ...prev, items: prev.items.map((i) => (i._id === item._id ? data : i)) }));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[item._id];
        return next;
      });
    } catch (err) {
      setRowError((prev) => ({ ...prev, [item._id]: getErrorMessage(err, 'Could not update stock.') }));
    } finally {
      setSavingId('');
    }
  };

  if (state.status === 'loading') return <LoadingSpinner size="lg" label="Loading inventory..." />;
  if (state.status === 'error') {
    return <EmptyState icon={<AlertIcon size={32} />} title="We couldn't load inventory" message={state.error} action={{ label: 'Try again', onClick: retry }} />;
  }

  return (
    <div className="admin-page">
      <h1 className="page-title">Inventory</h1>

      <div className="admin-toolbar admin-toolbar--tabs">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={`chip-toggle${filter === f.key ? ' is-active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing here" message="No products match this filter." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th className="num">Price</th>
                <th className="num">Current Stock</th>
                <th>Update Stock</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id} className={item.outOfStock ? 'is-out-of-stock' : item.lowStock ? 'is-low-stock' : ''}>
                  <td>
                    <div className="admin-cell-media">
                      <span className="admin-thumb">{item.image ? <img src={item.image} alt="" /> : <ImageIcon size={18} />}</span>
                      <span>
                        {item.name}
                        {!item.isActive && <span className="admin-muted"> (inactive)</span>}
                      </span>
                    </div>
                  </td>
                  <td>{item.category || '\u2014'}</td>
                  <td className="num">${item.price.toFixed(2)}</td>
                  <td className="num">
                    <span className={item.outOfStock ? 'stock-badge stock-badge--out' : item.lowStock ? 'stock-badge stock-badge--low' : 'stock-badge'}>
                      {item.stock}
                    </span>
                  </td>
                  <td>
                    <div className="inventory-edit">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-control"
                        placeholder={String(item.stock)}
                        value={drafts[item._id] ?? ''}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [item._id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={savingId === item._id || drafts[item._id] === undefined || drafts[item._id] === ''}
                        onClick={() => handleSave(item)}
                      >
                        {savingId === item._id ? '...' : 'Save'}
                      </button>
                    </div>
                    {rowError[item._id] && <span className="field-error">{rowError[item._id]}</span>}
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
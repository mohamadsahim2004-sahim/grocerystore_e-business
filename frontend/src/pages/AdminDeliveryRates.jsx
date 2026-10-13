import React, { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { AlertIcon } from '../components/Icons';
import { BASE_CURRENCY } from '../config/currency';

// Admin > Settings: delivery charge per Sri Lankan province.
// Everything here is only a form - the backend (/api/admin/delivery-rates) enforces the admin role and validates values.
const toRow = (r) => ({
  province: r.province,
  confirmed: r.confirmed,
  enabled: r.enabled,
  // A province that has never been saved has no real charge yet, so the field starts empty
  charge: r.confirmed ? String(r.charge) : ''
});

export default function AdminDeliveryRates() {
  const [state, setState] = useState({ status: 'loading', rows: [], freeAbove: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, status: 'loading' }));
    api
      .get('/admin/delivery-rates')
      .then(({ data }) => !cancelled && setState({ status: 'ready', rows: data.rates.map(toRow), freeAbove: data.freeShippingAbove, error: '' }))
      .catch((err) => !cancelled && setState({ status: 'error', rows: [], freeAbove: null, error: getErrorMessage(err, 'Could not load delivery charges.') }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const update = (province, patch) => {
    setState((prev) => ({ ...prev, rows: prev.rows.map((r) => (r.province === province ? { ...r, ...patch } : r)) }));
    setErrors((prev) => ({ ...prev, [province]: undefined }));
    setMessage({ type: '', text: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setMessage({ type: '', text: '' });

    // Only provinces with a charge entered are sent; blank provinces stay "not set" and customers cannot order to them
    const found = {};
    const payload = [];
    state.rows.forEach((r) => {
      const text = r.charge.trim();
      if (text === '') return;
      const value = Number(text);
      if (!Number.isFinite(value) || value < 0) found[r.province] = 'Enter a number of 0 or more';
      else if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) found[r.province] = 'At most 2 decimal places';
      else payload.push({ province: r.province, charge: value, enabled: r.enabled });
    });
    setErrors(found);
    if (Object.keys(found).length) {
      setMessage({ type: 'error', text: 'Please fix the highlighted charges.' });
      return;
    }
    if (payload.length === 0) {
      setMessage({ type: 'error', text: 'Enter a delivery charge for at least one province.' });
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put('/admin/delivery-rates', { rates: payload });
      setState((prev) => ({ ...prev, rows: data.rates.map(toRow), freeAbove: data.freeShippingAbove }));
      setMessage({ type: 'success', text: 'Delivery charges saved.' });
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
      setMessage({ type: 'error', text: getErrorMessage(err, 'Could not save delivery charges.') });
    } finally {
      setSaving(false);
    }
  };

  if (state.status === 'loading') return <LoadingSpinner size="lg" label="Loading delivery charges..." />;
  if (state.status === 'error') {
    return <EmptyState icon={<AlertIcon size={32} />} title="We couldn't load delivery charges" message={state.error} action={{ label: 'Try again', onClick: retry }} />;
  }

  const unset = state.rows.filter((r) => !r.confirmed).length;

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1 className="page-title">Delivery Charges</h1>
      </div>

      <p className="admin-muted">
        Set the delivery charge for each province ({BASE_CURRENCY}, the store&apos;s base currency). Customers are charged this amount when they order to the
        province; orders keep the charge they were placed with.
        {state.freeAbove != null && ` Orders with items above ${state.freeAbove} ${BASE_CURRENCY} ship free.`}
      </p>
      {unset > 0 && (
        <p className="notice notice--warn" role="status">
          {unset} province{unset === 1 ? ' has' : 's have'} no charge yet. Customers cannot place orders to a province until its charge is saved.
        </p>
      )}

      <form onSubmit={handleSave} noValidate>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Province</th>
                <th>Delivery charge ({BASE_CURRENCY})</th>
                <th>Delivers here</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.map((r) => (
                <tr key={r.province}>
                  <td>{r.province} Province</td>
                  <td>
                    <input
                      className={`form-control${errors[r.province] ? ' has-error' : ''}`}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={r.charge}
                      placeholder="Not set"
                      onChange={(e) => update(r.province, { charge: e.target.value })}
                      aria-label={`Delivery charge for ${r.province} Province`}
                      aria-invalid={errors[r.province] ? 'true' : undefined}
                    />
                    {errors[r.province] && <span className="field-error">{errors[r.province]}</span>}
                  </td>
                  <td>
                    <label className="checkbox-label">
                      <input type="checkbox" checked={r.enabled} onChange={(e) => update(r.province, { enabled: e.target.checked })} />
                      <span>{r.enabled ? 'Yes' : 'No'}</span>
                    </label>
                  </td>
                  <td className="admin-muted">{r.confirmed ? 'Saved' : 'Not set'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {message.text && (
          <p className={message.type === 'success' ? 'success-msg' : 'error-msg'} role={message.type === 'success' ? 'status' : 'alert'}>
            {message.text}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Delivery Charges'}
        </button>
      </form>
    </div>
  );
}
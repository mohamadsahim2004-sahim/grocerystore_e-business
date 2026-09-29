import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { PinIcon, PlusIcon, AlertIcon } from '../components/Icons';

const MAX_ADDRESSES = 10;

const FIELDS = [
  { name: 'label', label: 'Label', autoComplete: 'off', placeholder: 'Home, Work...', maxLength: 30 },
  { name: 'street', label: 'Address', autoComplete: 'street-address', wide: true, maxLength: 200 },
  { name: 'city', label: 'City', autoComplete: 'address-level2', maxLength: 100 },
  { name: 'postalCode', label: 'Postal Code', autoComplete: 'postal-code', maxLength: 12 },
  { name: 'country', label: 'Country', autoComplete: 'country-name', maxLength: 100 }
];

const emptyForm = { label: 'Home', street: '', city: '', postalCode: '', country: 'Sri Lanka', isDefault: false };

// Same rules the server enforces (the server always re-checks)
function validate(form) {
  const errors = {};
  const len = (key, label, min, max) => {
    const t = form[key].trim();
    if (t.length < min || t.length > max) errors[key] = `${label} must be between ${min} and ${max} characters`;
  };
  len('label', 'Label', 1, 30);
  len('street', 'Address', 3, 200);
  len('city', 'City', 2, 100);
  len('postalCode', 'Postal code', 2, 12);
  len('country', 'Country', 2, 100);
  if (!errors.postalCode && !/^[A-Za-z0-9\- ]+$/.test(form.postalCode.trim())) {
    errors.postalCode = 'Enter a valid postal code';
  }
  return errors;
}

export default function AddressesPage() {
  const { user, syncAddresses } = useContext(AuthContext);
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });

  // formMode: null (closed) | 'new' | an address _id being edited
  const [formMode, setFormMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [confirmId, setConfirmId] = useState('');
  const formRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get('/profile/addresses');
      setAddresses(data.addresses);
      syncAddresses(data.addresses);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'We could not load your addresses.'));
    } finally {
      setLoading(false);
    }
  }, [syncAddresses]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (formMode) formRef.current?.querySelector('input')?.focus();
  }, [formMode]);

  const applyResult = (list, message) => {
    setAddresses(list);
    syncAddresses(list);
    setStatus({ type: 'success', text: message });
  };

  const openNew = () => {
    setStatus({ type: '', text: '' });
    setFieldErrors({});
    setConfirmId('');
    setForm({ ...emptyForm, isDefault: addresses.length === 0 });
    setFormMode('new');
  };

  const openEdit = (address) => {
    setStatus({ type: '', text: '' });
    setFieldErrors({});
    setConfirmId('');
    setForm({
      label: address.label || 'Home',
      street: address.street || '',
      city: address.city || '',
      postalCode: address.postalCode || '',
      country: address.country || '',
      isDefault: Boolean(address.isDefault)
    });
    setFormMode(address._id);
  };

  const closeForm = () => {
    setFormMode(null);
    setFieldErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    if (fieldErrors[name]) setFieldErrors({ ...fieldErrors, [name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setStatus({ type: '', text: '' });

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const isNew = formMode === 'new';
      const { data } = isNew
        ? await api.post('/profile/addresses', form)
        : await api.put(`/profile/addresses/${formMode}`, form);
      applyResult(data.addresses, isNew ? 'Address added.' : 'Address updated.');
      setFormMode(null);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setFieldErrors(data.errors);
      setStatus({ type: 'error', text: getErrorMessage(err, 'We could not save this address.') });
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (address) => {
    setStatus({ type: '', text: '' });
    setBusyId(address._id);
    try {
      const { data } = await api.patch(`/profile/addresses/${address._id}/default`);
      applyResult(data.addresses, 'Default address updated.');
    } catch (err) {
      setStatus({ type: 'error', text: getErrorMessage(err, 'We could not update your default address.') });
    } finally {
      setBusyId('');
    }
  };

  const remove = async (address) => {
    setStatus({ type: '', text: '' });
    setBusyId(address._id);
    try {
      const { data } = await api.delete(`/profile/addresses/${address._id}`);
      applyResult(data.addresses, 'Address deleted.');
      setConfirmId('');
      if (formMode === address._id) setFormMode(null);
    } catch (err) {
      setStatus({ type: 'error', text: getErrorMessage(err, 'We could not delete this address.') });
    } finally {
      setBusyId('');
    }
  };

  const showForm = formMode !== null;
  const atLimit = addresses.length >= MAX_ADDRESSES;

  return (
    <div className="account-panel">
      <div className="panel__head-row address-head">
        <h1 className="page-title">My Addresses</h1>
        {!loading && !loadError && addresses.length > 0 && !showForm && (
          <button type="button" className="btn btn-primary btn-sm" onClick={openNew} disabled={atLimit}>
            <PlusIcon size={16} /> Add Address
          </button>
        )}
      </div>
      <p className="account-panel__lead">Your default address is pre-filled at checkout.</p>

      {status.text && (
        <p className={status.type === 'success' ? 'success-msg' : 'error-msg'} role={status.type === 'success' ? 'status' : 'alert'}>
          {status.text}
        </p>
      )}

      {loading && addresses.length === 0 ? (
        <LoadingSpinner label="Loading your addresses..." />
      ) : loadError ? (
        <EmptyState
          icon={<AlertIcon size={32} />}
          title="We couldn't load your addresses"
          message={loadError}
          action={{ label: 'Try again', onClick: load }}
        />
      ) : (
        <>
          {showForm && (
            <form className="address-form" onSubmit={handleSubmit} noValidate ref={formRef} aria-labelledby="addr-form-title">
              <h2 id="addr-form-title">{formMode === 'new' ? 'Add a new address' : 'Edit address'}</h2>
              <div className="form-grid">
                {FIELDS.map((f) => (
                  <div key={f.name} className={`form-group${f.wide ? ' form-group--wide' : ''}`}>
                    <label htmlFor={`addr-${f.name}`}>{f.label}</label>
                    <input
                      id={`addr-${f.name}`}
                      className={`form-control${fieldErrors[f.name] ? ' has-error' : ''}`}
                      type="text"
                      name={f.name}
                      value={form[f.name]}
                      onChange={handleChange}
                      autoComplete={f.autoComplete}
                      placeholder={f.placeholder}
                      maxLength={f.maxLength}
                      aria-invalid={fieldErrors[f.name] ? 'true' : undefined}
                      aria-describedby={fieldErrors[f.name] ? `addr-${f.name}-err` : undefined}
                    />
                    {fieldErrors[f.name] && (
                      <span id={`addr-${f.name}-err`} className="field-error">
                        {fieldErrors[f.name]}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <label className="check-row">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={form.isDefault}
                  onChange={handleChange}
                  disabled={addresses.length === 0 || (formMode !== 'new' && form.isDefault)}
                />
                <span>Use as my default address</span>
              </label>

              <div className="profile-form__actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : formMode === 'new' ? 'Save Address' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-outline" onClick={closeForm} disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {addresses.length === 0 && !showForm ? (
            <EmptyState
              icon={<PinIcon size={32} />}
              title="No saved addresses yet"
              message="Save a delivery address to check out faster next time."
              action={{ label: 'Add an address', onClick: openNew }}
            />
          ) : (
            <ul className="address-list">
              {addresses.map((address) => {
                const busy = busyId === address._id;
                return (
                  <li key={address._id} className={`address-card${address.isDefault ? ' is-default' : ''}`}>
                    <div className="address-card__top">
                      <strong>{address.label || 'Address'}</strong>
                      {address.isDefault && <span className="address-card__tag">Default</span>}
                    </div>
                    <address className="address-card__body">
                      {address.street}
                      <br />
                      {address.city}, {address.postalCode}
                      <br />
                      {address.country}
                    </address>

                    {confirmId === address._id ? (
                      <div className="address-card__confirm" role="group" aria-label="Confirm delete">
                        <span>Delete this address?</span>
                        <button type="button" className="btn btn-sm btn-danger-outline" onClick={() => remove(address)} disabled={busy}>
                          {busy ? 'Deleting...' : 'Yes, delete'}
                        </button>
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => setConfirmId('')} disabled={busy}>
                          Keep
                        </button>
                      </div>
                    ) : (
                      <div className="address-card__actions">
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => openEdit(address)} disabled={busy}>
                          Edit
                        </button>
                        {!address.isDefault && (
                          <button type="button" className="btn btn-sm btn-outline" onClick={() => setDefault(address)} disabled={busy}>
                            {busy ? 'Updating...' : 'Set as default'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            setConfirmId(address._id);
                            setStatus({ type: '', text: '' });
                          }}
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {atLimit && <p className="account-panel__lead">You have reached the limit of {MAX_ADDRESSES} saved addresses.</p>}
        </>
      )}
    </div>
  );
}
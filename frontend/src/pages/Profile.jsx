import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const formatMemberSince = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Same rules the server enforces (the server always re-checks)
function validate({ name, email, phone }) {
  const errors = {};
  const n = name.trim();
  if (n.length < 2 || n.length > 100) errors.name = 'Name must be between 2 and 100 characters';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address';
  const p = phone.trim();
  if (p && (!/^[+()\-\s\d]+$/.test(p) || p.length > 20 || p.replace(/\D/g, '').length < 7)) {
    errors.phone = 'Enter a valid phone number';
  }
  return errors;
}

export default function Profile() {
  const { user, fetchProfile, updateProfile } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [memberSince, setMemberSince] = useState(user?.createdAt || '');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [fetching, setFetching] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load the latest profile from the API
  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((profile) => {
        if (!cancelled) {
          setFormData({
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || ''
          });
          setMemberSince(profile.createdAt || '');
        }
      })
      .catch((err) => {
        if (!cancelled) setStatus({ type: 'error', text: err.message });
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchProfile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) setFieldErrors({ ...fieldErrors, [e.target.name]: undefined });
  };

  const handleEdit = () => {
    setStatus({ type: '', text: '' });
    setFieldErrors({});
    setEditing(true);
  };

  const handleCancel = () => {
    setFormData({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    setStatus({ type: '', text: '' });
    setFieldErrors({});
    setEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing || saving) return;
    setStatus({ type: '', text: '' });

    const errors = validate(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const updated = await updateProfile(formData);
      setFormData({
        name: updated.name || '',
        email: updated.email || '',
        phone: updated.phone || ''
      });
      setStatus({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="account-panel">
      <div className="account-panel__head">
        <span className="account-avatar account-avatar--lg" aria-hidden="true">
          {(formData.name || user?.name || 'U').trim()[0]?.toUpperCase()}
        </span>
        <div>
          <h1 className="page-title">{fetching ? 'My Profile' : formData.name || 'My Profile'}</h1>
          {!fetching && formData.email && <p className="account-panel__email">{formData.email}</p>}
        </div>
      </div>

      {status.text && (
        <p className={status.type === 'success' ? 'success-msg' : 'error-msg'} role={status.type === 'success' ? 'status' : 'alert'}>
          {status.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="profile-form" noValidate>
        <div className="form-group">
          <label htmlFor="pf-name">Full Name</label>
          <input
            id="pf-name"
            className={`form-control${fieldErrors.name ? ' has-error' : ''}`}
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={fetching || !editing}
            required
            aria-invalid={fieldErrors.name ? 'true' : undefined}
            aria-describedby={fieldErrors.name ? 'pf-name-err' : undefined}
          />
          {fieldErrors.name && (
            <span id="pf-name-err" className="field-error">
              {fieldErrors.name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="pf-email">Email Address</label>
          <input
            id="pf-email"
            className={`form-control${fieldErrors.email ? ' has-error' : ''}`}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={fetching || !editing}
            required
            aria-invalid={fieldErrors.email ? 'true' : undefined}
            aria-describedby={fieldErrors.email ? 'pf-email-err' : undefined}
          />
          {fieldErrors.email && (
            <span id="pf-email-err" className="field-error">
              {fieldErrors.email}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="pf-phone">Phone Number</label>
          <input
            id="pf-phone"
            className={`form-control${fieldErrors.phone ? ' has-error' : ''}`}
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={fetching || !editing}
            placeholder="+94 77 123 4567"
            aria-invalid={fieldErrors.phone ? 'true' : undefined}
            aria-describedby={fieldErrors.phone ? 'pf-phone-err' : undefined}
          />
          {fieldErrors.phone && (
            <span id="pf-phone-err" className="field-error">
              {fieldErrors.phone}
            </span>
          )}
        </div>

        <div className="form-group">
          <span className="form-static-label">Member Since</span>
          <p className="form-static-value">{fetching ? '\u2013' : formatMemberSince(memberSince) || '\u2013'}</p>
        </div>

        <div className="profile-form__actions">
          {editing ? (
            <>
              <button key="save" type="submit" className="btn btn-primary" disabled={fetching || saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button key="cancel" type="button" className="btn btn-outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
            </>
          ) : (
            <button key="edit" type="button" className="btn btn-primary" onClick={handleEdit} disabled={fetching}>
              Edit Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
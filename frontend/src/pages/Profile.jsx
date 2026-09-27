import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const formatMemberSince = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function Profile() {
  const { user, fetchProfile, updateProfile } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [memberSince, setMemberSince] = useState(user?.createdAt || '');
  const [status, setStatus] = useState({ type: '', text: '' });
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
  };

  const handleEdit = () => {
    setStatus({ type: '', text: '' });
    setEditing(true);
  };

  const handleCancel = () => {
    setFormData({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    setStatus({ type: '', text: '' });
    setEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
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
        <p className={status.type === 'success' ? 'success-msg' : 'error-msg'} role="status">
          {status.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="pf-name">Full Name</label>
          <input
            id="pf-name"
            className="form-control"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={fetching || !editing}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="pf-email">Email Address</label>
          <input
            id="pf-email"
            className="form-control"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={fetching || !editing}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="pf-phone">Phone Number</label>
          <input
            id="pf-phone"
            className="form-control"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={fetching || !editing}
            placeholder="+94 77 123 4567"
          />
        </div>

        <div className="form-group">
          <span className="form-static-label">Member Since</span>
          <p className="form-static-value">{fetching ? '\u2013' : formatMemberSince(memberSince) || '\u2013'}</p>
        </div>

        <div className="profile-form__actions">
          {editing ? (
            <>
              <button type="submit" className="btn btn-primary" disabled={fetching || saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleEdit} disabled={fetching}>
              Edit Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
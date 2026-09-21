import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { user, fetchProfile, updateProfile, logout } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [status, setStatus] = useState({ type: '', text: '' });
  const [fetching, setFetching] = useState(true);
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
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>

      {status.text && (
        <p className={status.type === 'success' ? 'success-msg' : 'error-msg'} role="status">
          {status.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={fetching} required />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={fetching} required />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={fetching} placeholder="+94 77 123 4567" />
        </div>

        <button type="submit" className="primary-btn" disabled={fetching || saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
import React, { useContext, useState } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function ProfileModal() {
  const { isProfileOpen, setIsProfileOpen, user, setUser, formatPrice } = useContext(StoreContext);
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState(user);

  if (!isProfileOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setUser(formData);
    alert('Profile details updated successfully!');
    setIsProfileOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsProfileOpen(false)}>
      <div className="modal-card" style={{ maxWidth: '520px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            👤 Customer Account
          </h2>
          <button style={{ fontSize: '18px', fontWeight: 'bold', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsProfileOpen(false)}>
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)' }}>
          <button
            style={{ fontWeight: activeTab === 'details' ? 'bold' : 'normal', borderBottom: activeTab === 'details' ? '2px solid var(--neon-green-bright)' : 'none', paddingBottom: '6px', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', color: activeTab === 'details' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => setActiveTab('details')}
          >
            Personal Details
          </button>
          <button
            style={{ fontWeight: activeTab === 'orders' ? 'bold' : 'normal', borderBottom: activeTab === 'orders' ? '2px solid var(--neon-green-bright)' : 'none', paddingBottom: '6px', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', color: activeTab === 'orders' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => setActiveTab('orders')}
          >
            Order History
          </button>
        </div>

        {activeTab === 'details' ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="form-group">
              <label style={{ color: 'var(--text-primary)' }}>Full Name</label>
              <input className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label style={{ color: 'var(--text-primary)' }}>Email Address</label>
              <input className="form-control" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label style={{ color: 'var(--text-primary)' }}>Street Address</label>
              <input className="form-control" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label style={{ color: 'var(--text-primary)' }}>City</label>
                <input className="form-control" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
              </div>
              <div className="form-group">
                <label style={{ color: 'var(--text-primary)' }}>Postal Code</label>
                <input className="form-control" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="add-to-cart-btn" style={{ marginTop: '10px' }}>
              Save Profile
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {user.orderHistory.map((ord) => (
              <div key={ord.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>{ord.id}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ord.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>{formatPrice(ord.total)}</div>
                  <span style={{ fontSize: '11px', color: 'var(--neon-green-bright)', fontWeight: 'bold' }}>{ord.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
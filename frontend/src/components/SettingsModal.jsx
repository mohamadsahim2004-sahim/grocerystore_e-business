import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen, settings, setSettings } = useContext(StoreContext);

  if (!isSettingsOpen) return null;

  const handleCurrencyChange = (e) => {
    const val = e.target.value;
    const symbolMap = { EUR: '€', USD: '$', GBP: '£' };
    setSettings((prev) => ({ ...prev, currency: val, symbol: symbolMap[val] }));
  };

  return (
    <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
      <div className="modal-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            ⚙️ Store Settings
          </h2>
          <button style={{ fontSize: '18px', fontWeight: 'bold', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsSettingsOpen(false)}>
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-primary)' }}>
              Currency
            </label>
            <select className="form-control" value={settings.currency} onChange={handleCurrencyChange}>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="GBP">GBP (£) - British Pound</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-primary)' }}>
              Language
            </label>
            <select className="form-control" value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })}>
              <option value="English">English</option>
              <option value="German">Deutsch (German)</option>
              <option value="French">Français (French)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Theme Mode</span>
            <button
              className="add-to-cart-btn"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
              onClick={() => setSettings({ ...settings, theme: settings.theme === 'light' ? 'dark' : 'light' })}
            >
              {settings.theme === 'light' ? '☀️ Light' : '🌙 Dark'} Mode
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Order &amp; Offer Notifications</span>
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <button className="add-to-cart-btn" style={{ marginTop: '12px' }} onClick={() => setIsSettingsOpen(false)}>
            Save &amp; Apply
          </button>
        </div>
      </div>
    </div>
  );
}
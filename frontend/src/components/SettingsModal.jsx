import React from 'react';

export default function SettingsModal({ isOpen, onClose, settings, setSettings }) {
  if (!isOpen) return null;

  // Safe defaults to prevent crash if localStorage state is incomplete
  const safeSettings = {
    theme: 'dark',
    language: 'EN',
    region: 'Germany',
    currency: 'EUR',
    paymentDetails: { cardNumber: '', cardHolder: '', expiry: '', cvv: '' },
    ...settings
  };

  const paymentDetails = safeSettings.paymentDetails || { cardNumber: '', cardHolder: '', expiry: '', cvv: '' };

  const handleChange = (field, value) => {
    const updated = { ...safeSettings, [field]: value };
    setSettings(updated);
    localStorage.setItem('exotic_settings', JSON.stringify(updated));
  };

  const handlePaymentChange = (field, value) => {
    const updatedPayment = { ...paymentDetails, [field]: value };
    const updated = { ...safeSettings, paymentDetails: updatedPayment };
    setSettings(updated);
    localStorage.setItem('exotic_settings', JSON.stringify(updated));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>⚙️ Preferences & Settings</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profile-body">
          <div className="auth-form">
            <div className="form-group">
              <label>App Theme</label>
              <select
                className="search-input custom-input"
                value={safeSettings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
              >
                <option value="dark">🌙 Dark Mode</option>
                <option value="light">☀️ Light Mode</option>
              </select>
            </div>

            <div className="form-group">
              <label>Display Language</label>
              <select
                className="search-input custom-input"
                value={safeSettings.language}
                onChange={(e) => handleChange('language', e.target.value)}
              >
                <option value="EN">English (US/UK)</option>
                <option value="DE">Deutsch (Germany)</option>
                <option value="FR">Français (France)</option>
                <option value="ES">Español (Spain)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Region / Country</label>
              <select
                className="search-input custom-input"
                value={safeSettings.region}
                onChange={(e) => handleChange('region', e.target.value)}
              >
                <option value="Germany">Germany (DE)</option>
                <option value="Austria">Austria (AT)</option>
                <option value="Switzerland">Switzerland (CH)</option>
                <option value="France">France (FR)</option>
                <option value="Other EU">Other EU Country</option>
              </select>
            </div>

            <div className="form-group">
              <label>Currency</label>
              <select
                className="search-input custom-input"
                value={safeSettings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CHF">CHF (Fr)</option>
              </select>
            </div>

            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-dark)' }}>
              <h4 style={{ color: 'var(--leaf-green-glow)', marginBottom: '10px', fontSize: '13px' }}>
                💳 Saved Payment Details
              </h4>

              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  className="search-input custom-input"
                  placeholder="John Doe"
                  value={paymentDetails.cardHolder || ''}
                  onChange={(e) => handlePaymentChange('cardHolder', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  className="search-input custom-input"
                  placeholder="•••• •••• •••• 1234"
                  value={paymentDetails.cardNumber || ''}
                  onChange={(e) => handlePaymentChange('cardNumber', e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    className="search-input custom-input"
                    placeholder="MM/YY"
                    value={paymentDetails.expiry || ''}
                    onChange={(e) => handlePaymentChange('expiry', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="password"
                    className="search-input custom-input"
                    placeholder="123"
                    value={paymentDetails.cvv || ''}
                    onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button type="button" className="checkout-btn" style={{ marginTop: '12px' }} onClick={onClose}>
              Save & Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
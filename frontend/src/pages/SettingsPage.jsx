import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { StoreContext } from '../context/StoreContext';
import { LANGUAGES } from '../i18n/translations';
import { CURRENCIES, BASE_CURRENCY, CURRENCY_RATES_AS_OF } from '../config/currency';
import { LogoutIcon } from '../components/Icons';

export default function SettingsPage() {
  const { user, logout } = useContext(AuthContext);
  const { t, language, setLanguage, currency, setCurrency } = useContext(StoreContext);
  const navigate = useNavigate();
  const [languageSaved, setLanguageSaved] = useState(false);
  const [currencySaved, setCurrencySaved] = useState(false);

  const addresses = user?.addresses || [];
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  // Leave first, then clear the session, so a protected page never bounces to /login
  const handleLogout = async () => {
    navigate('/');
    await logout();
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    setLanguageSaved(true);
  };

  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
    setCurrencySaved(true);
  };

  return (
    <div className="account-panel">
      <h1 className="page-title">{t('Settings')}</h1>
      <p className="account-panel__lead">{t('Manage your account details and how you sign in.')}</p>

      <section className="settings-section" aria-labelledby="set-account">
        <div className="settings-section__head">
          <h2 id="set-account">{t('Account')}</h2>
          <Link to="/profile" className="btn btn-outline btn-sm">
            {t('Edit Profile')}
          </Link>
        </div>
        <dl className="settings-list">
          <div>
            <dt>{t('Name')}</dt>
            <dd>{user?.name || '\u2013'}</dd>
          </div>
          <div>
            <dt>{t('Email')}</dt>
            <dd>{user?.email || '\u2013'}</dd>
          </div>
          <div>
            <dt>{t('Phone')}</dt>
            <dd>{user?.phone || t('Not added')}</dd>
          </div>
        </dl>
      </section>

      <section className="settings-section" aria-labelledby="set-preferences">
        <div className="settings-section__head">
          <h2 id="set-preferences">{t('Preferences')}</h2>
        </div>
        <div className="form-group">
          <label htmlFor="set-language">{t('Display language')}</label>
          <select id="set-language" className="form-control" value={language} onChange={handleLanguageChange}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeLabel}
                {l.nativeLabel !== l.label ? ` (${l.label})` : ''}
              </option>
            ))}
          </select>
          <p className="settings-empty">{t('Choose the language used across the store.')}</p>
          {languageSaved && (
            <p className="success-msg" role="status">
              {t('Language updated.')}
            </p>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="set-currency">{t('Display currency')}</label>
          <select id="set-currency" className="form-control" value={currency} onChange={handleCurrencyChange}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} – {c.name}
              </option>
            ))}
          </select>
          <p className="settings-empty">
            {t('Prices are stored in {base} and converted for display only, at approximate rates (updated {date}).', {
              base: BASE_CURRENCY,
              date: CURRENCY_RATES_AS_OF
            })}
          </p>
          {currencySaved && (
            <p className="success-msg" role="status">
              {t('Currency updated.')}
            </p>
          )}
        </div>
      </section>

      <section className="settings-section" aria-labelledby="set-addresses">
        <div className="settings-section__head">
          <h2 id="set-addresses">{t('Addresses')}</h2>
          <Link to="/addresses" className="btn btn-outline btn-sm">
            {t('Manage Addresses')}
          </Link>
        </div>
        {defaultAddress ? (
          <dl className="settings-list">
            <div>
              <dt>{t('Default address')}</dt>
              <dd>
                {defaultAddress.street}, {defaultAddress.city}, {defaultAddress.postalCode}, {defaultAddress.country}
              </dd>
            </div>
            <div>
              <dt>{t('Saved addresses')}</dt>
              <dd>{addresses.length}</dd>
            </div>
          </dl>
        ) : (
          <p className="settings-empty">{t('You have no saved addresses yet.')}</p>
        )}
      </section>

      <section className="settings-section" aria-labelledby="set-session">
        <div className="settings-section__head">
          <h2 id="set-session">{t('Sign out')}</h2>
        </div>
        <p className="settings-empty">{t('Sign out of EXOTIC Food Market on this device.')}</p>
        <button type="button" className="btn btn-outline settings-logout" onClick={handleLogout}>
          <LogoutIcon size={18} /> {t('Log out')}
        </button>
      </section>
    </div>
  );
}
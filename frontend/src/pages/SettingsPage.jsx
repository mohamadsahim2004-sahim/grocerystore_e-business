import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogoutIcon } from '../components/Icons';

export default function SettingsPage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const addresses = user?.addresses || [];
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  // Leave first, then clear the session, so a protected page never bounces to /login
  const handleLogout = async () => {
    navigate('/');
    await logout();
  };

  return (
    <div className="account-panel">
      <h1 className="page-title">Settings</h1>
      <p className="account-panel__lead">Manage your account details and how you sign in.</p>

      <section className="settings-section" aria-labelledby="set-account">
        <div className="settings-section__head">
          <h2 id="set-account">Account</h2>
          <Link to="/profile" className="btn btn-outline btn-sm">
            Edit Profile
          </Link>
        </div>
        <dl className="settings-list">
          <div>
            <dt>Name</dt>
            <dd>{user?.name || '\u2013'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user?.email || '\u2013'}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{user?.phone || 'Not added'}</dd>
          </div>
        </dl>
      </section>

      <section className="settings-section" aria-labelledby="set-addresses">
        <div className="settings-section__head">
          <h2 id="set-addresses">Addresses</h2>
          <Link to="/addresses" className="btn btn-outline btn-sm">
            Manage Addresses
          </Link>
        </div>
        {defaultAddress ? (
          <dl className="settings-list">
            <div>
              <dt>Default address</dt>
              <dd>
                {defaultAddress.street}, {defaultAddress.city}, {defaultAddress.postalCode}, {defaultAddress.country}
              </dd>
            </div>
            <div>
              <dt>Saved addresses</dt>
              <dd>{addresses.length}</dd>
            </div>
          </dl>
        ) : (
          <p className="settings-empty">You have no saved addresses yet.</p>
        )}
      </section>

      <section className="settings-section" aria-labelledby="set-session">
        <div className="settings-section__head">
          <h2 id="set-session">Sign out</h2>
        </div>
        <p className="settings-empty">Sign out of EXOTIC Food Market on this device.</p>
        <button type="button" className="btn btn-outline settings-logout" onClick={handleLogout}>
          <LogoutIcon size={18} /> Log out
        </button>
      </section>
    </div>
  );
}
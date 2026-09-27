import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserIcon, PackageIcon, HeartIcon, PinIcon, SettingsIcon, LogoutIcon } from './Icons';

const NAV_ITEMS = [
  { to: '/profile', label: 'Profile', Icon: UserIcon },
  { to: '/orders', label: 'Orders', Icon: PackageIcon },
  { to: '/wishlist', label: 'Wishlist', Icon: HeartIcon },
  { to: '/addresses', label: 'Addresses', Icon: PinIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon }
];

// Wraps every page in the "My Account" area (Profile, Orders, Order details, Wishlist,
// Addresses, Settings) with the same left-hand navigation, matching the EXOTIC reference.
export default function AccountLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="account container page-section">
      <div className="account-layout">
        <aside className="account-sidebar" aria-label="Account navigation">
          {user && (
            <div className="account-sidebar__user">
              <span className="account-avatar" aria-hidden="true">
                {user.name?.trim()?.[0]?.toUpperCase() || 'U'}
              </span>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
            </div>
          )}
          <nav>
            <ul className="account-nav">
              {NAV_ITEMS.map(({ to, label, Icon }) => (
                <li key={to}>
                  <NavLink to={to} className={({ isActive }) => `account-nav__link${isActive ? ' is-active' : ''}`}>
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
              <li>
                <button type="button" className="account-nav__link account-nav__link--logout" onClick={handleLogout}>
                  <LogoutIcon size={18} />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="account-content">{children}</div>
      </div>
    </div>
  );
}
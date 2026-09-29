import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { UserIcon, PackageIcon, HeartIcon, PinIcon, LogoutIcon, SettingsIcon } from './Icons';
import { AuthContext } from '../context/AuthContext';

const NAV_ITEMS = [
  { name: 'Profile', to: '/profile', Icon: UserIcon },
  { name: 'Order History', to: '/orders', Icon: PackageIcon },
  { name: 'Wishlist', to: '/wishlist', Icon: HeartIcon },
  { name: 'Addresses', to: '/addresses', Icon: PinIcon },
  { name: 'Settings', to: '/settings', Icon: SettingsIcon }
];

// Shared shell for the signed-in customer pages (uses the .account-* styles in index.css)
export default function AccountLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Leave first, then clear the session, so a protected page never bounces to /login
  const handleLogout = async () => {
    navigate('/');
    await logout();
  };

  return (
    <div className="account container">
      <div className="account-layout">
        <aside className="account-sidebar" aria-label="My account">
          {user && (
            <div className="account-sidebar__user">
              <div className="account-avatar" aria-hidden="true">
                {(user.name || user.email || 'U').trim()[0]?.toUpperCase()}
              </div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
            </div>
          )}
          <nav className="account-nav">
            {NAV_ITEMS.map(({ name, to, Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `account-nav__link${isActive ? ' is-active' : ''}`}>
                <Icon size={18} />
                <span>{name}</span>
              </NavLink>
            ))}
            <button type="button" className="account-nav__link account-nav__link--logout" onClick={handleLogout}>
              <LogoutIcon size={18} />
              <span>Log out</span>
            </button>
          </nav>
        </aside>

        <div className="account-main">{children}</div>
      </div>
    </div>
  );
}
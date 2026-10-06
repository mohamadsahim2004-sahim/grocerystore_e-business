import React, {
  useContext
} from 'react';

import {
  NavLink,
  useNavigate
} from 'react-router-dom';

import {
  UserIcon,
  PackageIcon,
  HeartIcon,
  PinIcon,
  LogoutIcon,
  SettingsIcon
} from './Icons';

import {
  AuthContext
} from '../context/AuthContext';

import {
  StoreContext
} from '../context/StoreContext';

const NAV_ITEMS = [
  {
    name: 'Profile',
    to: '/profile',
    Icon: UserIcon
  },
  {
    name: 'Order History',
    to: '/orders',
    Icon: PackageIcon
  },
  {
    name: 'Wishlist',
    to: '/wishlist',
    Icon: HeartIcon
  },
  {
    name: 'Addresses',
    to: '/addresses',
    Icon: PinIcon
  },
  {
    name: 'Settings',
    to: '/settings',
    Icon: SettingsIcon
  }
];

export default function AccountLayout({
  children
}) {
  const auth =
    useContext(AuthContext);

  const store =
    useContext(StoreContext);

  const user =
    auth?.user || null;

  const logout =
    typeof auth?.logout ===
    'function'
      ? auth.logout
      : async () => {};

  const t =
    typeof store?.t ===
    'function'
      ? store.t
      : (text) => text;

  const navigate =
    useNavigate();

  const handleLogout =
    async () => {
      navigate('/');

      await logout();
    };

  return (
    <div className="account container">
      <div className="account-layout">
        <aside
          className="account-sidebar"
          aria-label={t(
            'My account'
          )}
        >
          {user && (
            <div className="account-sidebar__user">
              <div
                className="account-avatar"
                aria-hidden="true"
              >
                {user.avatar ? (
                  <img
                    src={
                      user.avatar
                    }
                    alt=""
                  />
                ) : (
                  (
                    user.name ||
                    user.email ||
                    'U'
                  )
                    .trim()
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>

              <div>
                <strong>
                  {user.name}
                </strong>

                <span>
                  {user.email}
                </span>
              </div>
            </div>
          )}

          <nav className="account-nav">
            {NAV_ITEMS.map(
              ({
                name,
                to,
                Icon
              }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({
                    isActive
                  }) =>
                    `account-nav__link${
                      isActive
                        ? ' is-active'
                        : ''
                    }`
                  }
                >
                  {Icon && (
                    <Icon
                      size={18}
                    />
                  )}

                  <span>
                    {t(name)}
                  </span>
                </NavLink>
              )
            )}

            <button
              type="button"
              className="account-nav__link account-nav__link--logout"
              onClick={
                handleLogout
              }
            >
              <LogoutIcon
                size={18}
              />

              <span>
                {t(
                  'Log out'
                )}
              </span>
            </button>
          </nav>
        </aside>

        <div className="account-main">
          {children}
        </div>
      </div>
    </div>
  );
}
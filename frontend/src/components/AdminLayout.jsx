import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import api from '../api/client';

const UNREAD_POLL_MS = 20000;

export default function AdminLayout({ children }) {
  const [supportUnread, setSupportUnread] = useState(0);

  // Number of customer messages nobody has opened yet (badge on the Support link)
  useEffect(() => {
    let cancelled = false;
    const check = () => {
      if (document.hidden) return;
      api
        .get('/admin/support/unread')
        .then(({ data }) => !cancelled && setSupportUnread(data.unread))
        .catch(() => {});
    };
    check();
    const timer = setInterval(check, UNREAD_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const navItems = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/products', label: 'Products' },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/inventory', label: 'Inventory' },
    { to: '/admin/support', label: 'Support', badge: supportUnread },
    { to: '/admin/settings', label: 'Settings' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <Link to="/admin" className="admin-sidebar__brand">
            Admin Panel
          </Link>
        </div>

        <nav className="admin-sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-sidebar__link${isActive ? ' active' : ''}`
              }
            >
              {item.label}
              {item.badge > 0 && (
                <span className="support-badge" aria-label={`${item.badge} unread`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <Link to="/" className="admin-sidebar__link">
            ← Back to Store
          </Link>
        </div>
      </aside>

      <main className="admin-layout__content">
        {children}
      </main>
    </div>
  );
}
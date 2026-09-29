import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const navItems = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/products', label: 'Products' },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/inventory', label: 'Inventory' },
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
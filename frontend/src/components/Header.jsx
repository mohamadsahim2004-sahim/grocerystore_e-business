import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import { AuthContext } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import SearchBar from './SearchBar';
import { UserIcon, CartIcon, MenuIcon, CloseIcon } from './Icons';
import useStoreNav from '../hooks/useStoreNav';
import { NAV_LINKS } from '../config/siteConfig';

function AccountMenu({ user, isAdmin, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointer = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={wrapperRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label={`Account menu for ${user.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <UserIcon size={22} />
      </button>

      {open && (
        <div className="account-menu__panel" role="menu">
          <div className="account-menu__user">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <Link to="/profile" role="menuitem" onClick={() => setOpen(false)}>
            My Profile
          </Link>
          <Link to="/orders" role="menuitem" onClick={() => setOpen(false)}>
            Order History
          </Link>
          <Link to="/wishlist" role="menuitem" onClick={() => setOpen(false)}>
            Wishlist
          </Link>
          <Link to="/addresses" role="menuitem" onClick={() => setOpen(false)}>
            Addresses
          </Link>
          <Link to="/settings" role="menuitem" onClick={() => setOpen(false)}>
            Settings
          </Link>
          {isAdmin && (
            <Link to="/admin" role="menuitem" onClick={() => setOpen(false)}>
              Admin Dashboard
            </Link>
          )}
          <button type="button" role="menuitem" onClick={onLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { cart, searchQuery } = useContext(StoreContext);
  const { user, isAdmin, logout } = useContext(AuthContext);
  const { pathname } = useLocation();
  const { isActive, getLinkProps, storeLinkProps, searchShop } = useStoreNav();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Close the mobile menu on route change and on Escape
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  const cartProps = { to: '/cart' };
  const homeProps = storeLinkProps('home');

  // Leave first, then clear the session, so a protected page never redirects to /login
  const handleLogout = async () => {
    homeProps.onClick();
    navigate('/');
    await logout();
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <button
          type="button"
          className="icon-btn menu-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
        </button>

        <BrandLogo
          variant="wordmark"
          onClick={() => {
            homeProps.onClick();
            setMenuOpen(false);
          }}
        />

        <SearchBar
          className="header-search"
          value={searchQuery}
          onChange={searchShop}
          onSubmit={searchShop}
          placeholder="Search for products..."
        />

        <nav className={`primary-nav${menuOpen ? ' is-open' : ''}`} id="primary-nav" aria-label="Primary">
          <ul>
            {NAV_LINKS.map((link) => {
              const linkProps = getLinkProps(link);
              const active = isActive(link);
              return (
                <li key={link.label}>
                  <Link
                    {...linkProps}
                    className={`nav-link${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => {
                      linkProps.onClick?.();
                      setMenuOpen(false);
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="header-actions">
          {user ? (
            <AccountMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Link to="/login" className="icon-btn" aria-label="Login or register" title="Login / Register">
              <UserIcon size={22} />
            </Link>
          )}

          <Link
            {...cartProps}
            className="icon-btn"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            title="Cart"
          >
            <CartIcon size={22} />
            {cartCount > 0 && (
              <span className="badge" aria-hidden="true">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
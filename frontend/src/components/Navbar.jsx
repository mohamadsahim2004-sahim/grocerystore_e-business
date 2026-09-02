import React from 'react';
import { BrandLogo } from './Logos';

export default function Navbar({
  currentPage,
  setCurrentPage,
  searchQuery,
  setSearchQuery,
  cartCount,
  setIsCartOpen,
  wishlistCount,
  setIsWishlistOpen,
  setIsProfileOpen,
  setIsSettingsOpen,
  setSelectedCategory
}) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Updated Brand Logo */}
        <div
          className="navbar-brand"
          onClick={() => {
            setSelectedCategory('ALL');
            setCurrentPage('home');
          }}
        >
          <BrandLogo />
        </div>

        <div className="nav-links">
          <button
            className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('ALL');
              setCurrentPage('home');
            }}
          >
            HOME
          </button>
          <button
            className={`nav-btn ${currentPage === 'listing' ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('ALL');
              setCurrentPage('listing');
            }}
          >
            PRODUCTS
          </button>
          <button
            className={`nav-btn ${currentPage === 'about' ? 'active' : ''}`}
            onClick={() => setCurrentPage('about')}
          >
            ABOUT
          </button>
          <button
            className={`nav-btn ${currentPage === 'contact' ? 'active' : ''}`}
            onClick={() => setCurrentPage('contact')}
          >
            CONTACT
          </button>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search exotic foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (currentPage !== 'listing') setCurrentPage('listing');
            }}
          />
        </div>

        <div className="nav-actions">
          <button className="icon-btn" onClick={() => setIsWishlistOpen(true)} title="Wishlist">
            ❤️ {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
          </button>
          <button className="icon-btn" onClick={() => setIsCartOpen(true)} title="Cart">
            🛒 {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
          <button className="icon-btn" onClick={() => setIsProfileOpen(true)} title="Profile">
            👤
          </button>
          <button className="icon-btn" onClick={() => setIsSettingsOpen(true)} title="Settings">
            ⚙️
          </button>
        </div>
      </div>
    </nav>
  );
}
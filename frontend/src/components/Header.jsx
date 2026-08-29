import React from 'react';

export default function Header({
  currentPage,
  setCurrentPage,
  searchQuery,
  setSearchQuery,
  cartCount,
  setIsCartOpen,
  wishlistCount,
  setIsWishlistOpen,
  setIsProfileOpen,
  setSelectedCategory
}) {
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 'listing') {
      setCurrentPage('listing');
    }
  };

  const navigateToPage = (pageName) => {
    setCurrentPage(pageName);
    if (pageName === 'listing') {
      setSelectedCategory('ALL');
    }
  };

  return (
    <header className="header">
      <div className="logo-container" onClick={() => navigateToPage('home')}>
        <svg className="logo-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 26 42 C 34 16, 96 14, 96 36 C 72 32, 42 46, 26 42 Z" fill="#ffffff" />
          <path d="M 24 58 C 44 32, 98 32, 82 62 C 54 56, 30 74, 24 58 Z" fill="#4ade80" />
          <path d="M 32 60 Q 56 56 78 61" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 46 58 Q 50 53 58 52" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 58 59 Q 64 55 70 54" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 82 48 L 102 48 C 96 54, 88 56, 82 56 Z" fill="#ffffff" />
          <path d="M 26 76 C 40 68, 88 64, 96 78 C 66 88, 38 90, 26 76 Z" fill="#ffffff" />
        </svg>

        <div className="logo-text">
          <span className="logo-title">EXOTIC</span>
          <span className="logo-subtitle">Authentic & Global Flavors</span>
          <span className="logo-tagline">🛒 Food Markt</span>
        </div>
      </div>

      <ul className="nav-links">
        <li>
          <button className={currentPage === 'home' ? 'active' : ''} onClick={() => navigateToPage('home')}>
            HOME
          </button>
        </li>
        <li>
          <button className={currentPage === 'listing' ? 'active' : ''} onClick={() => navigateToPage('listing')}>
            PRODUCTS
          </button>
        </li>
        <li>
          <button onClick={() => navigateToPage('listing')}>SPECIALS</button>
        </li>
      </ul>

      <div className="search-container">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="Search for exotic groceries..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="nav-actions">
        <button className="action-btn" title="Account" onClick={() => setIsProfileOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>

        <button className="action-btn" title="Wishlist" onClick={() => setIsWishlistOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
        </button>

        <button className="action-btn" title="Cart" onClick={() => setIsCartOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}
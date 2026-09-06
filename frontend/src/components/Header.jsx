import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import BrandLogo from './BrandLogo';

export default function Header() {
  const {
    cart,
    wishlist,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    setShowOnlySpecials,
    showOnlySpecials,
    setIsSettingsOpen,
    setIsWishlistOpen,
    setIsProfileOpen,
    setIsCartOpen
  } = useContext(StoreContext);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleNav = (page, category = 'ALL', specialsOnly = false) => {
    setSelectedCategory(category);
    setShowOnlySpecials(specialsOnly);
    setCurrentPage(page);
  };

  return (
    <header className="site-header">
      <div onClick={() => handleNav('home')}>
        <BrandLogo />
      </div>

      <ul className="nav-links">
        <li>
          <button className={currentPage === 'home' && !showOnlySpecials ? 'active' : ''} onClick={() => handleNav('home')}>
            HOME
          </button>
        </li>
        <li>
          <button className={currentPage === 'products' && !showOnlySpecials ? 'active' : ''} onClick={() => handleNav('products', 'ALL', false)}>
            PRODUCTS
          </button>
        </li>
        <li>
          <button className={showOnlySpecials ? 'active' : ''} onClick={() => handleNav('products', 'ALL', true)}>
            🔥 SPECIALS
          </button>
        </li>
      </ul>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search for exotic groceries..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (currentPage !== 'products') setCurrentPage('products');
          }}
        />
      </div>

      <div className="header-icons">
        <button className="icon-btn" title="Account" onClick={() => setIsProfileOpen(true)}>
          👤
        </button>
        <button className="icon-btn" title="Wishlist" onClick={() => setIsWishlistOpen(true)}>
          ❤️
          {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
        </button>
        <button className="icon-btn" title="Cart" onClick={() => setIsCartOpen(true)}>
          🛒
          {totalCartCount > 0 && <span className="badge">{totalCartCount}</span>}
        </button>
        <button className="icon-btn" title="Settings" onClick={() => setIsSettingsOpen(true)}>
          ⚙️
        </button>
      </div>
    </header>
  );
}
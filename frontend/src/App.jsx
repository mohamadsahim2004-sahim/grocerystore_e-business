import React, { useState } from 'react';
import './App.css';

const categoryList = [
  { id: 1, name: 'SPICES & BLENDS', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop' },
  { id: 2, name: 'EXOTIC FRUITS', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&auto=format&fit=crop' },
  { id: 3, name: 'WORLD GRAINS', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop' },
  { id: 4, name: 'GLOBAL SNACKS', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&auto=format&fit=crop' },
  { id: 5, name: 'FRESH HERBS', image: 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=400&auto=format&fit=crop' }
];

const productList = [
  { id: 1, name: 'Premium Saffron Stigmas, 1g', price: '€14.99', image: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=300&auto=format&fit=crop' },
  { id: 2, name: 'Fresh Turmeric Root, 500g', price: '€4.50', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop' },
  { id: 3, name: 'Kashmiri Chili Powder, 200g', price: '€6.99', image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=300&auto=format&fit=crop' },
  { id: 4, name: 'Cardamom Pods, 100g', price: '€7.00', image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=300&auto=format&fit=crop' },
  { id: 5, name: 'Mango Chutney, 300g', price: '€5.50', image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=300&auto=format&fit=crop' },
  { id: 6, name: 'Jasmine Rice, 1kg', price: '€4.99', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop' },
  { id: 7, name: 'Exotic Dried Chilies, 50g', price: '€2.99', image: 'https://images.unsplash.com/photo-1627916607164-7b20241db935?w=300&auto=format&fit=crop' },
  { id: 8, name: 'Dragon Fruit (each)', price: '€3.50', image: 'https://images.unsplash.com/photo-1527325678964-54921646b988?w=300&auto=format&fit=crop' }
];

export default function App() {
  const [cartCount, setCartCount] = useState(3);

  return (
    <div>
      {/* Navigation Header */}
      <header className="header">
        <div className="logo-container">
          {/* Vector SVG exact match to the illuminated sign */}
          <svg className="logo-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Upper White Arc (E upper curve) */}
            <path d="M 26 42 C 34 16, 96 14, 96 36 C 72 32, 42 46, 26 42 Z" fill="#ffffff" />
            
            {/* Center Glowing Green Leaf */}
            <path d="M 24 58 C 44 32, 98 32, 82 62 C 54 56, 30 74, 24 58 Z" fill="#4ade80" />
            {/* Internal Leaf Veins */}
            <path d="M 32 60 Q 56 56 78 61" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 46 58 Q 50 53 58 52" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 58 59 Q 64 55 70 54" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
            
            {/* Middle Right White Accent (E middle extension) */}
            <path d="M 82 48 L 102 48 C 96 54, 88 56, 82 56 Z" fill="#ffffff" />

            {/* Lower White Arc (E bottom curve) */}
            <path d="M 26 76 C 40 68, 88 64, 96 78 C 66 88, 38 90, 26 76 Z" fill="#ffffff" />
          </svg>

          <div className="logo-text">
            <span className="logo-title">EXOTIC</span>
            <span className="logo-subtitle">Authentic & Global Flavors</span>
            <span className="logo-tagline">
              🛒 Food Markt
            </span>
          </div>
        </div>

        <ul className="nav-links">
          <li><a href="#home" className="active">HOME</a></li>
          <li><a href="#products">PRODUCTS</a></li>
          <li><a href="#specials">SPECIALS</a></li>
        </ul>

        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input className="search-input" type="text" placeholder="Search for exotic groceries..." />
        </div>

        <div className="nav-actions">
          <button className="action-btn" title="Account">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button className="action-btn" title="Wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button className="action-btn" title="Cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="cart-badge">{cartCount}</span>
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-box">
          <h1>Explore a World of Flavor.</h1>
          <p>Exotic Groceries, Delivered to Your Door in Germany.</p>
        </div>
      </section>

      {/* Product Categories */}
      <section className="section">
        <h2 className="section-title">Product Categories</h2>
        <div className="categories-grid">
          {categoryList.map((cat) => (
            <div key={cat.id} className="category-card">
              <img src={cat.image} alt={cat.name} />
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="section">
        <h2 className="section-title">Featured Products</h2>
        <div className="products-grid">
          {productList.map((prod) => (
            <div key={prod.id} className="product-card">
              <img src={prod.image} alt={prod.name} className="product-image" />
              <div className="product-name">{prod.name}</div>
              <div className="product-price">{prod.price}</div>
              <button className="add-btn" onClick={() => setCartCount(cartCount + 1)}>
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <ul className="footer-nav">
          <li><a href="#faq">FAQ</a></li>
          <li><a href="#shipping">SHIPPING INFO (Germany)</a></li>
          <li><a href="#impressum">IMPRESSUM</a></li>
          <li><a href="#privacy">PRIVACY POLICY</a></li>
          <li><a href="#contact">CONTACT</a></li>
          <li><a href="#about">ABOUT</a></li>
        </ul>
        <div className="copyright">@2026 EXOTIC GROCERY STORE</div>
      </footer>
    </div>
  );
}
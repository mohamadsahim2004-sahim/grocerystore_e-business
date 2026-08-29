import React, { useState } from 'react';
import { categories, allProducts } from './data/mockData';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import WishlistModal from './components/WishlistModal';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import HomePage from './pages/HomePage';
import ListingPage from './pages/ListingPage';
import FaqPage from './pages/FaqPage';
import ShippingPage from './pages/ShippingPage';
import ImpressumPage from './pages/ImpressumPage';
import PrivacyPage from './pages/PrivacyPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import './App.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  
  // Stored User State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('exotic_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Stored Preferences / Settings State
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('exotic_settings');
    return saved
      ? JSON.parse(saved)
      : {
          theme: 'dark',
          language: 'EN',
          region: 'Germany',
          currency: 'EUR',
          paymentDetails: { cardNumber: '', cardHolder: '', expiry: '', cvv: '' }
        };
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const filteredProducts = allProducts
    .filter((product) => {
      const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'low-high') return a.price - b.price;
      if (sortBy === 'high-low') return b.price - a.price;
      return 0;
    });

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setCurrentPage('listing');
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            categories={categories}
            products={allProducts}
            onSelectCategory={handleSelectCategory}
            onNavigateToListing={() => setCurrentPage('listing')}
            addToCart={addToCart}
            toggleWishlist={toggleWishlist}
            wishlist={wishlist}
          />
        );
      case 'listing':
        return (
          <ListingPage
            categories={categories}
            products={filteredProducts}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            sortBy={sortBy}
            setSortBy={setSortBy}
            addToCart={addToCart}
            toggleWishlist={toggleWishlist}
            wishlist={wishlist}
            searchQuery={searchQuery}
          />
        );
      case 'faq':
        return <FaqPage />;
      case 'shipping':
        return <ShippingPage />;
      case 'impressum':
        return <ImpressumPage />;
      case 'privacy':
        return <PrivacyPage />;
      case 'contact':
        return <ContactPage />;
      case 'about':
        return <AboutPage />;
      default:
        return (
          <HomePage
            categories={categories}
            products={allProducts}
            onSelectCategory={handleSelectCategory}
            onNavigateToListing={() => setCurrentPage('listing')}
            addToCart={addToCart}
            toggleWishlist={toggleWishlist}
            wishlist={wishlist}
          />
        );
    }
  };

  return (
    <div className={settings.theme === 'light' ? 'app-container light-theme' : 'app-container dark-theme'}>
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartCount={totalCartCount}
        setIsCartOpen={setIsCartOpen}
        wishlistCount={wishlist.length}
        setIsWishlistOpen={setIsWishlistOpen}
        setIsProfileOpen={setIsProfileOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setSelectedCategory={setSelectedCategory}
        user={user}
      />

      {renderPage()}

      <Footer onNavigate={(page) => setCurrentPage(page)} />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
      />

      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        toggleWishlist={toggleWishlist}
        addToCart={addToCart}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        setUser={setUser}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
      />
    </div>
  );
}
import React, { useContext } from 'react';
import { StoreProvider, StoreContext } from './context/StoreContext';
import Header from './components/Header';
import Footer from './components/Footer';
import CartModal from './components/CartModal';
import WishlistModal from './components/WishlistModal';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import InfoModal from './components/InfoModal';
import ProductDetailPage from './pages/ProductDetailPage';
import HomePage from './pages/HomePage';//
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';

function MainApp() {
  const { currentPage, settings } = useContext(StoreContext);
  const renderPage = () => {
    switch (currentPage) {
      case 'products':
        return <ProductsPage />;
      case 'detail':
        return <ProductDetailPage />;
      case 'cart':
        return <CartPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };


  return (
    <div className={`app-root ${settings.theme === 'light' ? 'light-mode' : 'dark-mode'}`}>
      <Header />
      <main style={{ minHeight: 'calc(100vh - 220px)' }}>
        {renderPage()}
      </main>
      <Footer />

      {/* Global Application Modals */}
      <CartModal />
      <WishlistModal />
      <ProfileModal />
      <SettingsModal />
      <InfoModal />
    </div>
  );
  
}

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
return (
    <div className="app-container">
      {/* 2. Route render check */}
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'products' && <ProductsPage />}
      {currentPage === 'detail' && <ProductDetailPage />}
    </div>
  );
  }
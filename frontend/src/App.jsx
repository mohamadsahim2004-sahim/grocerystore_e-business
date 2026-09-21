import React, { useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Providers & Context
import { StoreProvider, StoreContext } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import WishListPage from './pages/WishListPage';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PlaceholderPage from './pages/PlaceholderPage';

// Shared UI
import LoadingSpinner from './components/LoadingSpinner';
import { PLACEHOLDER_ROUTES } from './config/siteConfig';

// Legacy state page "products" now lives at the real /shop route
function RedirectToShop() {
  const { setCurrentPage } = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentPage('home');
    navigate('/shop', { replace: true });
  }, [setCurrentPage, navigate]);

  return null;
}

function MainApp() {
  const { isLoading, currentPage } = useContext(StoreContext);

  if (isLoading) {
    return <LoadingSpinner fullPage size="lg" label="Loading EXOTIC Food Market..." />;
  }

  // Store pages are state-driven and rendered at "/"
  const renderPage = () => {
    switch (currentPage) {
      case 'products':
        return <RedirectToShop />;
      case 'wishlist':
        return <WishListPage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="app-root">
      <Header />

      <main className="site-main">
        <Routes>
          {/* Public Store & Auth Routes */}
          <Route path="/" element={renderPage()} />
          <Route path="/shop" element={<ProductsPage />} />
          <Route path="/shop/:categorySlug" element={<ProductsPage />} />
          <Route path="/products" element={<Navigate to="/shop" replace />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishListPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Pages built in later phases */}
          {PLACEHOLDER_ROUTES.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Protected Routes (Requires Login) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:id" element={<OrderSuccessPage />} />
            <Route path="/orders" element={<OrderHistoryPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin Routes (Requires Login + admin role) */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <MainApp />
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}
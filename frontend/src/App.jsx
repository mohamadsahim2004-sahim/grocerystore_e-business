import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers & Context
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProducts from './components/AdminProducts';
import AdminProductForm from './components/AdminProductForm';
import AdminCategories from './components/AdminCategories';
import AdminLayout from './components/AdminLayout';
import ScrollToTop from './components/ScrollToTop';
import SupportChat from './components/SupportChat';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import WishListPage from './pages/WishListPage';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminCategoryForm from './pages/AdminCategoryForm';
import AdminOrders from './pages/AdminOrders';
import AdminOrderDetail from './pages/AdminOrderDetail';
import AdminUsers from './pages/AdminUser';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminInventory from './pages/AdminInventory';
import AdminSupport from './pages/AdminSupport';
import PlaceholderPage from './pages/PlaceholderPage';
import AddressesPage from './pages/AddressesPage';
import SettingsPage from './pages/SettingsPage';
import ShippingPage from './pages/ShippingPage';
import HelpPage from './pages/HelpPage';
import FaqPage from './pages/FaqPage';
import PrivacyPage from './pages/PrivacyPage';
import ContactPage from './pages/ContactPage';
import CategoriesPage from './pages/CategoriesPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';

// Shared UI
import AccountLayout from './components/AccountLayout';

function MainApp() {
  return (
    <div className="app-root">
      <ScrollToTop />
      <Header />

      <main className="site-main">
        <Routes>
          {/* Public Store & Auth Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ProductsPage />} />
          <Route path="/shop/:categorySlug" element={<ProductsPage />} />
          <Route path="/products" element={<Navigate to="/shop" replace />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Information pages (linked from the footer) */}
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Protected Routes (Requires Login) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:id" element={<OrderSuccessPage />} />

            {/* My Account: shared sidebar navigation */}
            <Route
              path="/profile"
              element={
                <AccountLayout>
                  <Profile />
                </AccountLayout>
              }
            />
            <Route
              path="/orders"
              element={
                <AccountLayout>
                  <OrderHistoryPage />
                </AccountLayout>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <AccountLayout>
                  <OrderDetailPage />
                </AccountLayout>
              }
            />
            <Route
              path="/wishlist"
              element={
                <AccountLayout>
                  <WishListPage />
                </AccountLayout>
              }
            />
            <Route
              path="/addresses"
              element={
                <AccountLayout>
                  <AddressesPage />
                </AccountLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <AccountLayout>
                  <SettingsPage />
                </AccountLayout>
              }
            />
          </Route>

          {/* Admin Routes (Requires Login + admin role) */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route
              path="/admin"
              element={
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminLayout>
                  <AdminProducts />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/products/new"
              element={
                <AdminLayout>
                  <AdminProductForm />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/products/:id/edit"
              element={
                <AdminLayout>
                  <AdminProductForm />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <AdminLayout>
                  <AdminCategories />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/categories/new"
              element={
                <AdminLayout>
                  <AdminCategoryForm />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/categories/:id/edit"
              element={
                <AdminLayout>
                  <AdminCategoryForm />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminLayout>
                  <AdminOrders />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/orders/:id"
              element={
                <AdminLayout>
                  <AdminOrderDetail />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/users/:id"
              element={
                <AdminLayout>
                  <AdminUserDetail />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <AdminLayout>
                  <AdminInventory />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/support/:id?"
              element={
                <AdminLayout>
                  <AdminSupport />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminLayout>
                  <PlaceholderPage title="Admin Settings" bare />
                </AdminLayout>
              }
            />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
      <SupportChat />
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
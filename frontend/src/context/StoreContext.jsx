import React, { createContext, useState, useEffect } from 'react';
import { initialProducts } from '../data/products';

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [products] = useState(initialProducts);

  // Cart State with localStorage Persistence
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('exotic_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  // Wishlist State with localStorage Persistence
  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem('exotic_wishlist');
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch {
      return [];
    }
  });

  // App Navigation & Filters State
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showOnlySpecials, setShowOnlySpecials] = useState(false);

  // User Profile & App Settings
  const [user, setUser] = useState({
    name: 'Alexander Schmidt',
    email: 'alexander@example.de',
    street: 'Friedrichstraße 42',
    city: 'Berlin',
    zip: '10117'
  });

  const [settings, setSettings] = useState({
    theme: 'dark',
    currency: 'EUR',
    language: 'EN'
  });

  // Modals Visibility
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', content: '' });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('exotic_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('exotic_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Cart Helper Functions
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
  };

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const toggleWishlist = (product) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.some((item) => item.id === product.id);
      if (exists) {
        return prevWishlist.filter((item) => item.id !== product.id);
      }
      return [...prevWishlist, product];
    });
  };

  // Currency Formatter
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: settings.currency || 'EUR'
    }).format(amount);
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        setCart,
        wishlist,
        addToCart,
        updateQuantity,
        toggleWishlist,
        currentPage,
        setCurrentPage,
        selectedProduct,
        setSelectedProduct,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        showOnlySpecials,
        setShowOnlySpecials,
        user,
        setUser,
        settings,
        setSettings,
        formatPrice,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        isProfileOpen,
        setIsProfileOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        infoModal,
        setInfoModal
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
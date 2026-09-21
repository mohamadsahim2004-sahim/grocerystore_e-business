import React, { createContext, useState, useEffect } from 'react';
import { initialProducts } from '../data/Products';

export const StoreContext = createContext();

const MAX_QTY = 99;

// Keeps only what the cart UI needs; drops anything malformed
const toCartItem = (item) => {
  if (!item || typeof item.id !== 'string' || !/^[a-f\d]{24}$/i.test(item.id)) return null;
  const quantity = Math.floor(Number(item.quantity));
  if (!Number.isFinite(quantity) || quantity < 1) return null;
  return {
    id: item.id,
    name: String(item.name || ''),
    price: Number(item.price) || 0,
    image: item.image || '',
    unit: item.unit || '',
    slug: item.slug || '',
    stock: typeof item.stock === 'number' ? item.stock : undefined,
    quantity: Math.min(quantity, MAX_QTY)
  };
};

// Highest quantity allowed for an item (known stock, never above MAX_QTY)
const maxFor = (item) => (typeof item.stock === 'number' ? Math.max(0, Math.min(item.stock, MAX_QTY)) : MAX_QTY);

export const StoreProvider = ({ children }) => {
  const [products] = useState(initialProducts);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading delay for app startup
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Cart State with localStorage Persistence (guest cart). Only a display snapshot is kept:
  // the server re-prices every item, so nothing stored here is trusted for money.
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem('exotic_cart') || '[]');
      return Array.isArray(savedCart) ? savedCart.map(toCartItem).filter(Boolean) : [];
    } catch (error) {
      console.error('Failed to parse cart from localStorage:', error);
      return [];
    }
  });

  // Promo code entered on the cart page (validated and applied by the server)
  const [promoCode, setPromoCode] = useState(() => {
    try {
      return localStorage.getItem('exotic_promo') || '';
    } catch {
      return '';
    }
  });

  // Wishlist State with localStorage Persistence
  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem('exotic_wishlist');
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch (error) {
      console.error('Failed to parse wishlist from localStorage:', error);
      return [];
    }
  });

  // App Navigation & Filters State
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showOnlySpecials, setShowOnlySpecials] = useState(false);

  // App Settings
  const [settings, setSettings] = useState({
    theme: 'dark',
    currency: 'USD',
    language: 'EN'
  });

  // Modals Visibility
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', content: '' });

  // Sync Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('exotic_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart]);

  // Sync promo code to LocalStorage
  useEffect(() => {
    try {
      if (promoCode) localStorage.setItem('exotic_promo', promoCode);
      else localStorage.removeItem('exotic_promo');
    } catch {
      /* storage unavailable */
    }
  }, [promoCode]);

  // Sync Wishlist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('exotic_wishlist', JSON.stringify(wishlist));
    } catch (error) {
      console.error('Failed to save wishlist to localStorage:', error);
    }
  }, [wishlist]);

  // Add product to cart (or increase quantity if already in cart). Quantity is a whole number
  // between 1 and min(stock, 99); anything above that is capped.
  const addToCart = (product, qty = 1) => {
    const wanted = Math.max(1, Math.floor(Number(qty)) || 1);
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        const stock = typeof product.stock === 'number' ? product.stock : existing.stock;
        const next = { ...existing, stock };
        const cap = maxFor(next);
        if (cap < 1) return prevCart;
        return prevCart.map((item) =>
          item.id === product.id ? { ...next, quantity: Math.min(item.quantity + wanted, cap) } : item
        );
      }
      const fresh = toCartItem({ ...product, quantity: 1 });
      if (!fresh) return prevCart;
      const cap = maxFor(fresh);
      if (cap < 1) return prevCart;
      return [...prevCart, { ...fresh, quantity: Math.min(wanted, cap) }];
    });
  };

  // Increment or decrement cart item quantity (never above stock, removed when it reaches 0)
  const updateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id !== productId) return item;
          const newQty = Math.min(item.quantity + Math.trunc(delta), maxFor(item));
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        })
        .filter(Boolean)
    );
  };

  // Remove item completely from cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // Clear entire cart (and any promo code)
  const clearCart = () => {
    setCart([]);
    setPromoCode('');
  };

  // Toggle Wishlist item presence
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currency || 'USD'
    }).format(amount);
  };

  return (
    <StoreContext.Provider
      value={{
        isLoading,
        products,
        cart,
        setCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        promoCode,
        setPromoCode,
        wishlist,
        toggleWishlist,
        currentPage,
        setCurrentPage,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        showOnlySpecials,
        setShowOnlySpecials,
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
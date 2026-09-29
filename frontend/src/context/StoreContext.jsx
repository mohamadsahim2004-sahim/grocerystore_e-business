import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import api, { getErrorMessage } from '../api/client';

export const StoreContext = createContext();

const MAX_QTY = 99;
const CURRENCY = 'USD';

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
  const { user } = useContext(AuthContext);

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

  // Wishlist: a guest's wishlist lives in localStorage. Once signed in, the server
  // (GET/POST/DELETE /api/wishlist, backed by real Product references on the User) is the
  // source of truth, so it is never written back to localStorage while authenticated.
  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem('exotic_wishlist');
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch (error) {
      console.error('Failed to parse wishlist from localStorage:', error);
      return [];
    }
  });
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState('');
  const [wishlistAttempt, setWishlistAttempt] = useState(0);
  const mergedGuestWishlist = useRef(false);

  // True while `wishlist` holds a signed-in user's server wishlist; never write it to the guest localStorage copy
  const wishlistIsAccountOwned = useRef(false);

  // App Navigation & Filters State
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Sync Wishlist to LocalStorage (guests only)
  useEffect(() => {
    if (user || wishlistIsAccountOwned.current) return;
    try {
      localStorage.setItem('exotic_wishlist', JSON.stringify(wishlist));
    } catch (error) {
      console.error('Failed to save wishlist to localStorage:', error);
    }
  }, [wishlist, user]);

  // On login: merge any guest wishlist into the account once, then load the real wishlist
  // from the server. On logout: fall back to whatever is left in the guest wishlist.
  useEffect(() => {
    if (!user) {
      wishlistIsAccountOwned.current = false;
      mergedGuestWishlist.current = false;
      setWishlistError('');
      try {
        const saved = JSON.parse(localStorage.getItem('exotic_wishlist') || '[]');
        setWishlist(Array.isArray(saved) ? saved : []);
      } catch {
        setWishlist([]);
      }
      return undefined;
    }

    let cancelled = false;
    wishlistIsAccountOwned.current = true;
    setWishlistLoading(true);
    setWishlistError('');

    (async () => {
      try {
        if (!mergedGuestWishlist.current) {
          mergedGuestWishlist.current = true;
          let guestItems = [];
          try {
            guestItems = JSON.parse(localStorage.getItem('exotic_wishlist') || '[]');
          } catch {
            guestItems = [];
          }
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            await Promise.allSettled(guestItems.map((item) => api.post(`/wishlist/${item.id}`)));
            localStorage.removeItem('exotic_wishlist');
          }
        }
        const { data } = await api.get('/wishlist');
        if (!cancelled) setWishlist(data.map((p) => ({ ...p, id: p.id || p._id })));
      } catch (error) {
        if (!cancelled) setWishlistError(getErrorMessage(error, 'Could not load your wishlist.'));
      } finally {
        if (!cancelled) setWishlistLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, wishlistAttempt]);

  const reloadWishlist = useCallback(() => setWishlistAttempt((n) => n + 1), []);

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

  // Toggle Wishlist item presence. Signed-in users are saved to the server (optimistic,
  // reverted if the request fails); guests are saved to localStorage only.
  const toggleWishlist = async (product) => {
    const exists = wishlist.some((item) => item.id === product.id);
    setWishlist((prevWishlist) =>
      exists ? prevWishlist.filter((item) => item.id !== product.id) : [...prevWishlist, product]
    );

    if (!user && !wishlistIsAccountOwned.current) return;

    try {
      setWishlistError('');
      if (exists) await api.delete(`/wishlist/${product.id}`);
      else await api.post(`/wishlist/${product.id}`);
    } catch (error) {
      // Roll back the optimistic update
      setWishlist((prevWishlist) =>
        exists ? [...prevWishlist, product] : prevWishlist.filter((item) => item.id !== product.id)
      );
      setWishlistError(getErrorMessage(error, 'Could not update your wishlist.'));
    }
  };

  // Currency Formatter
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: CURRENCY
    }).format(amount);
  };

  return (
    <StoreContext.Provider
      value={{
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
        wishlistLoading,
        wishlistError,
        reloadWishlist,
        currentPage,
        setCurrentPage,
        searchQuery,
        setSearchQuery,
        formatPrice
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
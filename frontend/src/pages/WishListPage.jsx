import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { AlertIcon } from '../components/Icons';

export default function WishlistPage() {
  const { wishlist, wishlistLoading, wishlistError, reloadWishlist } = useContext(StoreContext);

  return (
    <div className="account-panel">
      <h1 className="page-title">My Wishlist {!wishlistLoading && !wishlistError && `(${wishlist.length})`}</h1>
      <p className="account-panel__lead">Saved items to quickly review or add to your basket later.</p>

      {wishlistLoading ? (
        <LoadingSpinner label="Loading your wishlist..." />
      ) : wishlistError ? (
        <EmptyState
          icon={<AlertIcon size={32} />}
          title="We couldn't load your wishlist"
          message={wishlistError}
          action={{ label: 'Try again', onClick: reloadWishlist }}
        />
      ) : wishlist.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          message="Click the heart icon on any product to save it here."
          action={{ label: 'Explore Catalog', to: '/shop' }}
        />
      ) : (
        <div className="product-grid">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function ProductCard({ product }) {
  const { addToCart, wishlist, toggleWishlist, setSelectedProduct, setCurrentPage, formatPrice } = useContext(StoreContext);

  const isWishlisted = wishlist.some((item) => item.id === product.id);

  // Check if product is currently on offer
  const hasDiscount = Boolean(product.oldPrice && product.oldPrice > product.price);
  const discountPercent = product.offerPercent || (hasDiscount ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0);
  const savings = hasDiscount ? product.oldPrice - product.price : 0;

  const handleCardClick = () => {
  setSelectedProduct(product);
  setCurrentPage('detail');
  };

  return (
    <div className="card" style={{ position: 'relative', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      
      {/* Discount Percentage Badge */}
      {hasDiscount && (
        <span
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '900',
            padding: '4px 8px',
            borderRadius: '4px',
            zIndex: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          {discountPercent}% OFF
        </span>
      )}

      {/* Wishlist Button */}
      <button
        className="heart-btn"
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product);
        }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.5)',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          cursor: 'pointer',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isWishlisted ? '❤️' : '🤍'}
      </button>

      {/* Product Image */}
      <div onClick={handleCardClick} style={{ cursor: 'pointer', overflow: 'hidden', height: '180px' }}>
        <img
          src={product.image}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Product Body */}
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>📍 {product.origin}</span>
            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>★ {product.rating}</span>
          </div>

          <h3
            onClick={handleCardClick}
            style={{
              fontSize: '15px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: '0 0 4px 0',
              cursor: 'pointer',
              lineHeight: '1.3',
              height: '38px',
              overflow: 'hidden'
            }}
          >
            {product.name}
          </h3>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Unit: {product.unit}
          </div>
        </div>

        {/* PRICE DISPLAY SECTION */}
        <div style={{ marginBottom: '12px' }}>
          {hasDiscount ? (
            /* ON OFFER: Shows Old Price, Offer Price, and Savings Individually */
            <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Regular Price:</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 'bold' }}>
                  {formatPrice(product.oldPrice)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--neon-green-bright)', fontWeight: 'bold' }}>Offer Price:</span>
                <span style={{ fontSize: '18px', color: 'var(--neon-green-bright)', fontWeight: '900' }}>
                  {formatPrice(product.price)}
                </span>
              </div>

              <div style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold', marginTop: '4px', textAlign: 'right' }}>
                You Save: {formatPrice(savings)} ({discountPercent}%)
              </div>
            </div>
          ) : (
            /* REGULAR PRICE: Product Not On Offer */
            <div style={{ padding: '8px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Price:</span>
                <span style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: '800' }}>
                  {formatPrice(product.price)}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          className="add-to-cart-btn"
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          style={{
            width: '100%',
            padding: '10px',
            background: 'var(--neon-green-bright)',
            color: '#000',
            fontWeight: '800',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🛒 Add to Cart
        </button>
      </div>
    </div>
  );
}



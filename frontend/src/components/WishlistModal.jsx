import React from 'react';

export default function WishlistModal({ isOpen, onClose, wishlist, toggleWishlist, addToCart }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>Your Wishlist</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {wishlist.length === 0 ? (
            <p className="empty-msg">No saved items in your wishlist.</p>
          ) : (
            wishlist.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} />
                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  <div className="cart-item-price">€{item.price.toFixed(2)}</div>
                </div>
                <button
                  className="add-btn"
                  style={{ padding: '6px 12px', fontSize: '10px' }}
                  onClick={() => {
                    addToCart(item);
                    toggleWishlist(item);
                  }}
                >
                  Move to Cart
                </button>
                <button className="remove-btn" onClick={() => toggleWishlist(item)}>✕</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
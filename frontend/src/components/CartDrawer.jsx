import React from 'react';

export default function CartDrawer({ isOpen, onClose, cart, updateQuantity, removeFromCart }) {
  if (!isOpen) return null;

  const totalAmount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>Your Shopping Cart</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <p className="empty-msg">Your shopping cart is currently empty.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} />
                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  <div className="cart-item-price">€{item.price.toFixed(2)}</div>
                  <div className="qty-controls">
                    <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                  </div>
                </div>
                <button className="remove-btn" onClick={() => removeFromCart(item.id)}>🗑️</button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="total-row">
              <span>Total Amount:</span>
              <span className="total-price">€{totalAmount.toFixed(2)}</span>
            </div>
            <button className="checkout-btn" onClick={() => alert('Proceeding to Checkout!')}>
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
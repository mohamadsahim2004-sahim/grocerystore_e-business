import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import { AuthContext } from '../context/AuthContext';
import QuantityControl from '../components/QuantityControl';
import EmptyState from '../components/EmptyState';
import CurrencyNotice from '../components/CurrencyNotice';
import LoadingSpinner from '../components/LoadingSpinner';
import { ImageIcon, TrashIcon, CartIcon, AlertIcon } from '../components/Icons';
import useCartQuote from '../hooks/useCartQuote';

const ISSUE_TEXT = {
  unavailable: 'No longer available',
  out_of_stock: 'Out of stock'
};

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, formatPrice, promoCode, setPromoCode } = useContext(StoreContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { quote, loading, error, refresh } = useCartQuote(cart, promoCode);

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [notice, setNotice] = useState('');

  const lineById = useMemo(() => new Map((quote?.items || []).map((l) => [l.productId, l])), [quote]);

  // Quantities above the real stock are reduced automatically
  useEffect(() => {
    if (!quote) return;
    const tooMany = quote.items.filter((l) => l.issue === 'insufficient_stock');
    if (tooMany.length === 0) return;
    tooMany.forEach((l) => {
      const item = cart.find((i) => i.id === l.productId);
      if (item) updateQuantity(item.id, l.stock - item.quantity);
    });
    setNotice(tooMany.map((l) => `"${l.name}" was reduced to ${l.stock} because that is all we have in stock.`).join(' '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote]);

  // An invalid promo code is reported once and dropped
  useEffect(() => {
    if (quote?.promo && !quote.promo.valid) {
      setPromoError(quote.promo.message);
      setPromoCode('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote]);

  const applyPromo = (e) => {
    e.preventDefault();
    const code = promoInput.trim();
    if (!code) {
      setPromoError('Enter a promo code');
      return;
    }
    setPromoError('');
    setPromoCode(code.toUpperCase());
    setPromoInput('');
  };

  if (cart.length === 0) {
    return (
      <div className="container page-section">
        <EmptyState
          title="Your cart is empty"
          message="Looks like you haven't added anything yet."
          action={{ label: 'Continue Shopping', to: '/shop' }}
        />
      </div>
    );
  }

  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const promoApplied = quote?.promo?.valid ? quote.promo : null;
  const freeShippingGap = quote && quote.itemsPrice > 0 && quote.itemsPrice <= quote.freeShippingThreshold ? quote.freeShippingThreshold - quote.itemsPrice : 0;

  return (
    <div className="cart container">
      <div className="cart-head">
        <h1 className="page-title">
          Your Cart <span className="cart-head__count">({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
        </h1>
        <button type="button" className="link-btn" onClick={clearCart}>
          Clear cart
        </button>
      </div>

      {notice && (
        <p className="notice notice--warn" role="status">
          {notice}
        </p>
      )}

      <div className="cart-layout">
        <ul className="cart-items" aria-label="Cart items">
          {cart.map((item) => {
            const line = lineById.get(item.id);
            const issue = line?.issue;
            const blocked = issue === 'unavailable' || issue === 'out_of_stock';
            const name = line && issue !== 'unavailable' ? line.name : item.name || 'Unavailable product';
            const price = line ? line.price : item.price;
            const stock = line ? line.stock : item.stock;
            const image = (line && line.image) || item.image;
            const unit = (line && line.unit) || item.unit;
            const lineTotal = line ? line.lineTotal : price * item.quantity;

            return (
              <li key={item.id} className={`cart-item${blocked ? ' is-blocked' : ''}`}>
                <Link to={blocked ? '/shop' : `/products/${item.id}`} className="cart-item__image" aria-label={name}>
                  {image ? <img src={image} alt={name} loading="lazy" /> : <ImageIcon size={32} />}
                </Link>

                <div className="cart-item__info">
                  <Link to={blocked ? '/shop' : `/products/${item.id}`} className="cart-item__name">
                    {name}
                  </Link>
                  {unit && <span className="cart-item__unit">{unit}</span>}
                  <span className="cart-item__price">{formatPrice(price)}</span>
                  {blocked && <span className="cart-item__issue">{ISSUE_TEXT[issue]}</span>}
                  {!blocked && typeof stock === 'number' && stock <= 5 && <span className="cart-item__low">Only {stock} left</span>}
                </div>

                <div className="cart-item__qty">
                  <QuantityControl
                    value={item.quantity}
                    min={1}
                    max={Math.max(1, Math.min(typeof stock === 'number' ? stock : 99, 99))}
                    disabled={blocked}
                    label={`${name} quantity`}
                    onChange={(next) => updateQuantity(item.id, next - item.quantity)}
                  />
                </div>

                <div className="cart-item__total">{formatPrice(lineTotal)}</div>

                <button type="button" className="cart-item__remove" aria-label={`Remove ${name} from cart`} onClick={() => removeFromCart(item.id)}>
                  <TrashIcon size={20} />
                </button>
              </li>
            );
          })}
        </ul>

        <aside className="summary-card" aria-label="Order summary">
          <h2>Order Summary</h2>

          {promoApplied ? (
            <div className="promo-applied">
              <span>
                <strong>{promoApplied.code}</strong> applied &mdash; {promoApplied.message}
              </span>
              <button type="button" className="link-btn" onClick={() => setPromoCode('')}>
                Remove
              </button>
            </div>
          ) : (
            <form className="promo-form" onSubmit={applyPromo}>
              <label htmlFor="promo-input" className="sr-only">
                Promo code
              </label>
              <input id="promo-input" type="text" placeholder="Promo code" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} autoComplete="off" />
              <button type="submit" className="btn btn-outline">
                Apply
              </button>
            </form>
          )}
          {promoError && (
            <p className="error-msg" role="alert">
              {promoError}
            </p>
          )}

          {error ? (
            <div className="notice notice--error" role="alert">
              <AlertIcon size={18} /> <span>{error}</span>
              <button type="button" className="link-btn" onClick={refresh}>
                Try again
              </button>
            </div>
          ) : !quote ? (
            <LoadingSpinner size="sm" label="Calculating totals..." />
          ) : (
            <dl className="totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(quote.itemsPrice)}</dd>
              </div>
              {quote.discountPrice > 0 && (
                <div className="totals__discount">
                  <dt>Discount</dt>
                  <dd>-{formatPrice(quote.discountPrice)}</dd>
                </div>
              )}
              <div>
                <dt>Shipping</dt>
                <dd>{quote.shippingPending ? 'Calculated at checkout' : quote.shippingPrice === 0 ? 'Free' : formatPrice(quote.shippingPrice)}</dd>
              </div>
              <div className="totals__grand">
                <dt>Total</dt>
                <dd data-testid="cart-total">{formatPrice(quote.totalPrice)}</dd>
              </div>
            </dl>
          )}

          {quote && <CurrencyNotice amount={quote.totalPrice} />}
          {freeShippingGap > 0 && <p className="totals__hint">Add {formatPrice(freeShippingGap)} more for free shipping.</p>}
          {quote && quote.issues.length > 0 && <p className="error-msg">Remove unavailable items to continue.</p>}

          <button
            type="button"
            className="btn btn-primary btn-block pdp-btn"
            disabled={!quote || loading || !quote.canCheckout}
            onClick={() => navigate('/checkout')}
          >
            <CartIcon size={18} /> Proceed to Checkout
          </button>
          <Link to="/shop" className="btn btn-outline btn-block">
            Continue Shopping
          </Link>
          {!user && <p className="totals__hint">Your cart is saved. You&rsquo;ll be asked to sign in at checkout.</p>}
        </aside>
      </div>
    </div>
  );
}
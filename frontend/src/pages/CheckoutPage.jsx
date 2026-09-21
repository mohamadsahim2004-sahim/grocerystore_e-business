import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import { AuthContext } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { ImageIcon, AlertIcon } from '../components/Icons';
import useCartQuote from '../hooks/useCartQuote';

const FIELDS = [
  { name: 'fullName', label: 'Full Name', autoComplete: 'name', type: 'text' },
  { name: 'phone', label: 'Phone', autoComplete: 'tel', type: 'tel' },
  { name: 'street', label: 'Address', autoComplete: 'street-address', type: 'text' },
  { name: 'city', label: 'City', autoComplete: 'address-level2', type: 'text' },
  { name: 'postalCode', label: 'Postal Code', autoComplete: 'postal-code', type: 'text' },
  { name: 'country', label: 'Country', autoComplete: 'country-name', type: 'text' }
];

// Same rules the server enforces (the server always re-checks)
function validate(form) {
  const errors = {};
  const len = (v, min, max, key, label) => {
    const t = v.trim();
    if (t.length < min || t.length > max) errors[key] = `${label} must be between ${min} and ${max} characters`;
  };
  len(form.fullName, 2, 100, 'fullName', 'Full name');
  len(form.phone, 7, 20, 'phone', 'Phone number');
  len(form.street, 3, 200, 'street', 'Address');
  len(form.city, 2, 100, 'city', 'City');
  len(form.postalCode, 2, 12, 'postalCode', 'Postal code');
  len(form.country, 2, 100, 'country', 'Country');
  if (!errors.phone && (!/^[+()\-\s\d]+$/.test(form.phone.trim()) || form.phone.replace(/\D/g, '').length < 7)) {
    errors.phone = 'Enter a valid phone number';
  }
  if (!errors.postalCode && !/^[A-Za-z0-9\- ]+$/.test(form.postalCode.trim())) {
    errors.postalCode = 'Enter a valid postal code';
  }
  return errors;
}

export default function CheckoutPage() {
  const { cart, clearCart, formatPrice, promoCode } = useContext(StoreContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { quote, loading, error, refresh, setQuote } = useCartQuote(cart, promoCode);

  const saved = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0] || {};
  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: saved.street || '',
    city: saved.city || '',
    postalCode: saved.postalCode || '',
    country: saved.country || 'Sri Lanka'
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Once the account finishes loading, fill any still-empty fields
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({ ...prev, fullName: prev.fullName || user.name || '', phone: prev.phone || user.phone || '' }));
  }, [user]);

  if (cart.length === 0) {
    return (
      <div className="container page-section">
        <EmptyState
          title="Your cart is empty"
          message="Add something to your cart before checking out."
          action={{ label: 'Continue Shopping', to: '/shop' }}
        />
      </div>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) setFieldErrors({ ...fieldErrors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setFormError('');

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Please fix the highlighted fields.');
      return;
    }
    if (!quote || !quote.canCheckout) {
      setFormError('Please review the items in your cart first.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', {
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
        shippingAddress: form,
        paymentMethod,
        promoCode: promoCode || undefined,
        expectedTotal: quote.totalPrice
      });
      navigate(`/order-success/${data.order._id}`, { replace: true });
      clearCart();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setFieldErrors(data.errors);
      if (data?.quote) setQuote(data.quote);
      setFormError(data?.code === 'PRICE_CHANGED' ? `${data.message} New total: ${formatPrice(data.quote.totalPrice)}.` : getErrorMessage(err, 'We could not place your order.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/cart">Cart</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Checkout</span>
      </nav>
      <h1 className="page-title">Checkout</h1>

      <form className="checkout-layout" onSubmit={handleSubmit} noValidate>
        <div className="checkout-main">
          <section className="panel" aria-labelledby="ship-title">
            <h2 id="ship-title">Shipping Information</h2>
            <div className="form-grid">
              {FIELDS.map((f) => (
                <div key={f.name} className={`form-group${['street'].includes(f.name) ? ' form-group--wide' : ''}`}>
                  <label htmlFor={`co-${f.name}`}>{f.label}</label>
                  <input
                    id={`co-${f.name}`}
                    className={`form-control${fieldErrors[f.name] ? ' has-error' : ''}`}
                    type={f.type}
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    autoComplete={f.autoComplete}
                    aria-invalid={fieldErrors[f.name] ? 'true' : undefined}
                    aria-describedby={fieldErrors[f.name] ? `co-${f.name}-err` : undefined}
                  />
                  {fieldErrors[f.name] && (
                    <span id={`co-${f.name}-err`} className="field-error">
                      {fieldErrors[f.name]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="pay-title">
            <h2 id="pay-title">Payment Method</h2>
            <div className="pay-options" role="radiogroup" aria-labelledby="pay-title">
              <label className={`pay-option${paymentMethod === 'COD' ? ' is-selected' : ''}`}>
                <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                <span>
                  <strong>Cash on Delivery</strong>
                  <small>Pay in cash when your order arrives.</small>
                </span>
              </label>
              <label className={`pay-option${paymentMethod === 'CARD' ? ' is-selected' : ''}`}>
                <input type="radio" name="payment" value="CARD" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} />
                <span>
                  <strong>Credit / Debit Card (Test mode)</strong>
                  <small>Simulated payment for testing.</small>
                </span>
              </label>
            </div>
            {paymentMethod === 'CARD' && (
              <p className="notice notice--info" role="note">
                Test mode: no real payment is processed and no card details are collected or stored. Your order will be marked as paid.
              </p>
            )}
          </section>
        </div>

        <aside className="summary-card" aria-label="Order summary">
          <h2>Order Summary</h2>

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
            <>
              <ul className="summary-items">
                {quote.items.map((line) => (
                  <li key={line.productId}>
                    <span className="summary-items__img">{line.image ? <img src={line.image} alt="" /> : <ImageIcon size={22} />}</span>
                    <span className="summary-items__name">
                      {line.name}
                      <small>
                        Qty {line.quantity}
                        {line.issue ? ` – ${line.issue === 'insufficient_stock' ? `only ${line.stock} left` : line.issue === 'out_of_stock' ? 'out of stock' : 'unavailable'}` : ''}
                      </small>
                    </span>
                    <span>{formatPrice(line.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <dl className="totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(quote.itemsPrice)}</dd>
                </div>
                {quote.discountPrice > 0 && (
                  <div className="totals__discount">
                    <dt>Discount ({quote.promo.code})</dt>
                    <dd>-{formatPrice(quote.discountPrice)}</dd>
                  </div>
                )}
                <div>
                  <dt>Shipping</dt>
                  <dd>{quote.shippingPrice === 0 ? 'Free' : formatPrice(quote.shippingPrice)}</dd>
                </div>
                <div className="totals__grand">
                  <dt>Total</dt>
                  <dd data-testid="checkout-total">{formatPrice(quote.totalPrice)}</dd>
                </div>
              </dl>
            </>
          )}

          {formError && (
            <p className="error-msg" role="alert">
              {formError}
            </p>
          )}
          {quote && !quote.canCheckout && (
            <p className="error-msg">
              Some items are unavailable. <Link to="/cart">Review your cart</Link>.
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-block pdp-btn" disabled={submitting || loading || !quote || !quote.canCheckout}>
            {submitting ? 'Placing order...' : 'Place Order'}
          </button>
          <Link to="/cart" className="btn btn-outline btn-block">
            Back to Cart
          </Link>
        </aside>
      </form>
    </div>
  );
}
import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import { AuthContext } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import CurrencyNotice from '../components/CurrencyNotice';
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

function validate(form) {
  const errors = {};
  const len = (v, min, max, key, label) => {
    const t = (v || '').trim();
    if (t.length < min || t.length > max) {
      errors[key] = `${label} must be between ${min} and ${max} characters`;
    }
  };

  len(form.fullName, 2, 100, 'fullName', 'Full name');
  len(form.phone, 7, 20, 'phone', 'Phone number');
  len(form.street, 3, 200, 'street', 'Address');
  len(form.city, 2, 100, 'city', 'City');
  len(form.postalCode, 2, 12, 'postalCode', 'Postal code');
  len(form.country, 2, 100, 'country', 'Country');
  if (!form.province) errors.province = 'Select your delivery province';

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

  const savedAddresses = user?.addresses || [];
  const defaultAddress = savedAddresses.find((a) => a.isDefault) || savedAddresses[0] || {};

  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress._id || 'new');
  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: defaultAddress.street || '',
    city: defaultAddress.city || '',
    postalCode: defaultAddress.postalCode || '',
    country: defaultAddress.country || 'Sri Lanka',
    province: ''
  });
  const { quote, loading, error, refresh, setQuote } = useCartQuote(cart, promoCode, form.province);

  // Provinces the store delivers to (GET /api/delivery-rates, set by the admin)
  const [rates, setRates] = useState({ status: 'loading', list: [], error: '' });
  const [ratesAttempt, setRatesAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setRates((prev) => ({ ...prev, status: 'loading', error: '' }));
    api
      .get('/delivery-rates')
      .then(({ data }) => !cancelled && setRates({ status: 'ready', list: data.rates, error: '' }))
      .catch((err) => !cancelled && setRates({ status: 'error', list: [], error: getErrorMessage(err, 'Could not load delivery areas.') }));
    return () => {
      cancelled = true;
    };
  }, [ratesAttempt]);

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || user.name || '',
      phone: prev.phone || user.phone || ''
    }));
  }, [user]);

  const handleSelectAddress = (addressId) => {
    setSelectedAddressId(addressId);
    if (addressId === 'new') return;

    const chosen = savedAddresses.find((a) => a._id === addressId);
    if (chosen) {
      setForm((prev) => ({
        ...prev,
        street: chosen.street || '',
        city: chosen.city || '',
        postalCode: chosen.postalCode || '',
        country: chosen.country || 'Sri Lanka'
      }));
      setFieldErrors({});
    }
  };

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
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: undefined });
    }
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
      if (data?.code === 'PROVINCE_UNAVAILABLE') {
        // The admin switched this province off meanwhile: reload the list and ask for another one
        setForm((prev) => ({ ...prev, province: '' }));
        setRatesAttempt((n) => n + 1);
      }

      setFormError(
        data?.code === 'PRICE_CHANGED'
          ? `${data.message} New total: ${formatPrice(data.quote.totalPrice)}.`
          : getErrorMessage(err, 'We could not place your order.')
      );
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

            {savedAddresses.length > 0 && (
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="address-select">Select Saved Address</label>
                <select
                  id="address-select"
                  className="form-control"
                  value={selectedAddressId}
                  onChange={(e) => handleSelectAddress(e.target.value)}
                >
                  {savedAddresses.map((addr) => (
                    <option key={addr._id} value={addr._id}>
                      {addr.street}, {addr.city} {addr.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                  <option value="new">+ Enter a new address</option>
                </select>
              </div>
            )}

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

              <div className="form-group">
                <label htmlFor="co-province">Delivery Province</label>
                <select
                  id="co-province"
                  className={`form-control${fieldErrors.province ? ' has-error' : ''}`}
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  disabled={rates.status !== 'ready'}
                  aria-invalid={fieldErrors.province ? 'true' : undefined}
                  aria-describedby={fieldErrors.province ? 'co-province-err' : undefined}
                >
                  <option value="">
                    {rates.status === 'loading' ? 'Loading provinces...' : 'Select a province'}
                  </option>
                  {rates.list.map((r) => (
                    <option key={r.province} value={r.province}>
                      {r.province} Province
                    </option>
                  ))}
                </select>
                {fieldErrors.province && (
                  <span id="co-province-err" className="field-error">
                    {fieldErrors.province}
                  </span>
                )}
                {rates.status === 'error' && (
                  <span className="field-error">
                    {rates.error}{' '}
                    <button type="button" className="link-btn" onClick={() => setRatesAttempt((n) => n + 1)}>
                      Try again
                    </button>
                  </span>
                )}
                {rates.status === 'ready' && rates.list.length === 0 && (
                  <span className="field-error">We are not delivering to any province right now.</span>
                )}
              </div>
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
                Test mode: no real payment is processed and no card details are stored. Your order will be marked as paid instantly.
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
                    <dt>Discount ({quote.promo?.code})</dt>
                    <dd>-{formatPrice(quote.discountPrice)}</dd>
                  </div>
                )}
                <div>
                  <dt>Shipping</dt>
                  <dd>
                    {quote.shippingPending
                      ? 'Select a province'
                      : quote.shippingPrice === 0
                        ? 'Free'
                        : formatPrice(quote.shippingPrice)}
                  </dd>
                </div>
                <div className="totals__grand">
                  <dt>Total</dt>
                  <dd data-testid="checkout-total">{formatPrice(quote.totalPrice)}</dd>
                </div>
              </dl>
              <CurrencyNotice amount={quote.totalPrice} />
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

          <button type="submit" className="btn btn-primary btn-block pdp-btn" disabled={submitting || loading || !quote || !quote.canCheckout || quote.shippingPending || quote.provinceUnavailable}>
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
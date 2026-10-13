import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import { AuthContext } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import CurrencyNotice from '../components/CurrencyNotice';
import LoadingSpinner from '../components/LoadingSpinner';
import { ImageIcon, AlertIcon } from '../components/Icons';
import useCartQuote from '../hooks/useCartQuote';
import { formatMoney } from '../config/currency';
import { phoneError, postalCodeError } from '../lib/addressValidation';
import { rememberPendingOrder, submitPayHereForm } from '../lib/payhere';

const FIELDS = [
  { name: 'fullName', label: 'Full Name', autoComplete: 'name', type: 'text' },
  { name: 'phone', label: 'Phone', autoComplete: 'tel', type: 'tel' },
  { name: 'street', label: 'Address', autoComplete: 'street-address', type: 'text' },
  { name: 'city', label: 'City', autoComplete: 'address-level2', type: 'text' },
  { name: 'postalCode', label: 'Postal Code', autoComplete: 'postal-code', type: 'text' },
  { name: 'country', label: 'Country', autoComplete: 'country-name', type: 'text' }
];

// Same rules and messages as the backend (backend/routes/orderRoutes.js + utils/addressValidation.js)
function validate(form) {
  const errors = {};
  const len = (v, min, max, key, label) => {
    const t = (v || '').trim();
    if (!t) errors[key] = `${label} is required`;
    else if (t.length < min || t.length > max) errors[key] = `${label} must be between ${min} and ${max} characters`;
  };

  len(form.fullName, 2, 100, 'fullName', 'Full name');
  len(form.street, 3, 200, 'street', 'Address');
  len(form.city, 2, 100, 'city', 'City');
  len(form.country, 2, 100, 'country', 'Country');
  if (!form.province) errors.province = 'Select your delivery province';

  // Phone and postal code formats depend on the country (Sri Lanka: 07XXXXXXXX / +947XXXXXXXX / 947XXXXXXXX, 5-digit postal code)
  const phoneProblem = phoneError(form.phone, form.country);
  if (phoneProblem) errors.phone = phoneProblem;
  const postalProblem = postalCodeError(form.postalCode, form.country);
  if (postalProblem) errors.postalCode = postalProblem;
  return errors;
}

// One key per checkout visit: if the same order is submitted twice (double click, retry after a lost response)
// the backend returns the order it already created instead of creating a second one.
const newIdempotencyKey = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `co-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 14)}`;
};

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
  const submitLock = useRef(false); // set synchronously, so a fast double click cannot submit twice
  const idempotencyKey = useRef(newIdempotencyKey());
  const [redirecting, setRedirecting] = useState(false); // true while the customer is being sent to PayHere

  // Province follows the city: 'auto' = filled from the city, 'manual' = chosen/corrected by the customer.
  const provinceSource = useRef('');
  const [provinceHint, setProvinceHint] = useState('');
  useEffect(() => {
    if (rates.status !== 'ready') return undefined;
    const city = form.city.trim();
    if (!city) {
      setProvinceHint('');
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .get('/delivery-rates/province', { params: { city } })
        .then(({ data }) => {
          if (cancelled) return;
          const province = data.province || '';
          if (province && rates.list.some((r) => r.province === province)) {
            provinceSource.current = 'auto';
            setForm((prev) => ({ ...prev, province }));
            setFieldErrors((prev) => (prev.province ? { ...prev, province: undefined } : prev));
            setProvinceHint('');
            return;
          }
          if (province) {
            // Identified, but we cannot deliver there (disabled / no charge configured yet)
            provinceSource.current = '';
            setForm((prev) => ({ ...prev, province: '' }));
            setProvinceHint(`Delivery to ${province} Province is not available right now. Please contact us or choose another address.`);
            return;
          }
          // Not identified: never guess. Drop a province we filled in for a previous city, keep one the customer chose.
          if (provinceSource.current === 'auto') {
            provinceSource.current = '';
            setForm((prev) => ({ ...prev, province: '' }));
          }
          setProvinceHint("We couldn't identify the province for this city. Please select your delivery province.");
        })
        .catch(() => !cancelled && setProvinceHint('Please select your delivery province.'));
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.city, rates.status, rates.list]);

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

  if (cart.length === 0 && !redirecting) {
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
    if (e.target.name === 'province') {
      provinceSource.current = e.target.value ? 'manual' : '';
      setProvinceHint('');
    }
    setForm({ ...form, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: undefined });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLock.current || submitting) return;
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

    submitLock.current = true;
    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', {
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
        shippingAddress: form,
        paymentMethod,
        promoCode: promoCode || undefined,
        expectedTotal: quote.totalPrice,
        idempotencyKey: idempotencyKey.current
      });

      const order = data.order;

      // Online payment (PayHere). The order now exists as unpaid with its stock reserved. The backend signs the
      // PayHere fields from its own copy of the order; the order only becomes paid when PayHere's server
      // notification is verified by the backend - never because the browser came back.
      if (paymentMethod === 'CARD' && !order.isPaid) {
        try {
          const { data: pay } = await api.post('/payments/payhere/params', { orderId: order._id });
          rememberPendingOrder(order._id);
          setRedirecting(true);
          clearCart();
          submitPayHereForm(pay); // leaves the site; the page stays locked
        } catch (payErr) {
          // The order is saved and can be paid later from the cancel page / order history
          clearCart();
          navigate(`/payment/cancel?order_id=${order._id}&reason=error`, {
            replace: true,
            state: { message: getErrorMessage(payErr, 'We could not start the online payment.') }
          });
        }

        return;
      }

      // Cash on delivery or an order already paid by the backend.
      clearCart();
      navigate(`/order-success/${order._id}`, {
        replace: true
      });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setFieldErrors(data.errors);
      if (data?.quote) setQuote(data.quote);
      if (data?.code === 'PROVINCE_UNAVAILABLE') {
        setForm((prev) => ({ ...prev, province: '' }));
        setRatesAttempt((n) => n + 1);
      }

      setFormError(
        data?.code === 'PRICE_CHANGED'
          ? `${data.message} New total: ${formatPrice(data.quote.totalPrice)}.`
          : getErrorMessage(err, 'We could not place your order.')
      );
      submitLock.current = false;
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
                  <span className="field-error">Delivery is not set up yet, so orders cannot be placed right now. Please contact the store.</span>
                )}
                {provinceHint && !form.province && !fieldErrors.province && <span className="field-hint">{provinceHint}</span>}
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
                  <strong>Pay online with PayHere</strong>
                  <small>Visa, MasterCard and more, on PayHere's secure payment page.</small>
                </span>
              </label>
            </div>
            {paymentMethod === 'CARD' && (
              <p className="notice notice--info" role="note">
                You will be redirected to PayHere to pay (in LKR). Your order is marked as paid only after PayHere confirms the payment to our server.
                {' '}Card details are entered on PayHere's page and never reach this store.
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

          <button
            type="submit"
            className="btn btn-primary btn-block pdp-btn"
            disabled={submitting || loading || !quote || !quote.canCheckout || quote.shippingPending || quote.provinceUnavailable}
          >
            {submitting
              ? (paymentMethod === 'CARD' ? 'Redirecting to PayHere...' : 'Placing order...')
              : paymentMethod === 'CARD' ? 'Place Order & Pay with PayHere' : 'Place Order'}
          </button>
          <Link to="/cart" className="btn btn-outline btn-block">
            Back to Cart
          </Link>
        </aside>
      </form>
    </div>
  );
}
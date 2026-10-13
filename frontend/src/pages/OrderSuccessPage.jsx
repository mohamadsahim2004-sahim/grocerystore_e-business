import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import api, { getErrorMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircleIcon, ImageIcon, AlertIcon } from '../components/Icons';
import { PAYMENT_LABELS, formatLkr, formatOrderDate, paymentStatusLabel } from '../lib/orderFormat';
import { forgetPendingOrder, startPayHerePayment } from '../lib/payhere';

const POLL_MS = 3000;
const MAX_POLLS = 10; // ~30 s: PayHere's server notification can arrive a moment after the customer is redirected back
const FAILED_STATES = ['Failed', 'Cancelled', 'Chargedback'];
const isFailed = (o) => !o.isPaid && (FAILED_STATES.includes(o.paymentStatus) || o.status === 'Cancelled');
// An online order whose verified PayHere notification has not arrived yet
const isWaiting = (o) => o.paymentMethod === 'CARD' && !o.isPaid && !isFailed(o);

export default function OrderSuccessPage() {
  const { id } = useParams();
  const { formatPrice } = useContext(StoreContext);
  const [state, setState] = useState({ status: 'loading', order: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  const polls = useRef(0);
  const [retrying, setRetrying] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let timer;
    // Only the first load shows the spinner; background polls leave the page as it is
    setState((prev) => (prev.order && prev.order._id === id ? prev : { status: 'loading', order: null, error: '' }));
    api
      .get(`/orders/${id}`)
      .then(({ data }) => {
        if (cancelled) return;
        setState({ status: 'ready', order: data, error: '' });
        if (data.isPaid) {
          forgetPendingOrder();
        } else if (isWaiting(data) && polls.current < MAX_POLLS) {
          // Payment status only ever comes from the backend (set by PayHere's verified notification)
          timer = setTimeout(() => {
            polls.current += 1;
            setAttempt((n) => n + 1);
          }, POLL_MS);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 404) setState({ status: 'notfound', order: null, error: '' });
        else setState({ status: 'error', order: null, error: getErrorMessage(err, 'Could not load your order.') });
      });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id, attempt]);

  const retry = useCallback(() => {
    polls.current = 0;
    setAttempt((n) => n + 1);
  }, []);

  const payAgain = async () => {
    setPayError('');
    setRetrying(true);
    try {
      await startPayHerePayment(id); // leaves the page on success
    } catch (err) {
      setPayError(getErrorMessage(err, 'We could not start the payment. Please try again.'));
      setRetrying(false);
    }
  };

  if (state.status === 'loading') {
    return (
      <div className="container page-section">
        <LoadingSpinner size="lg" label="Loading your order..." />
      </div>
    );
  }
  if (state.status === 'notfound') {
    return (
      <div className="container page-section">
        <EmptyState title="Order not found" message="We couldn't find that order on your account." action={{ label: 'View Order History', to: '/orders' }} />
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="container page-section">
        <EmptyState icon={<AlertIcon size={32} />} title="We couldn't load your order" message={state.error} action={{ label: 'Try again', onClick: retry }} />
      </div>
    );
  }

  const { order } = state;
  const a = order.shippingAddress;
  const online = order.paymentMethod === 'CARD';
  const paid = order.isPaid;
  const failed = isFailed(order);
  const waiting = isWaiting(order);
  const timedOut = waiting && polls.current >= MAX_POLLS;

  let hero = { ok: true, title: 'Thank you for your order!', text: 'Your order has been placed successfully.' };
  if (online && paid) {
    hero = { ok: true, title: 'Payment successful', text: 'Thank you! PayHere has confirmed your payment and your order has been placed.' };
  } else if (online && failed) {
    hero = { ok: false, title: 'Payment not completed', text: 'Your order is saved, but the payment was not completed so it has not been paid.' };
  } else if (online) {
    hero = {
      ok: false,
      title: 'Order placed - waiting for payment confirmation',
      text: timedOut
        ? "We haven't received PayHere's confirmation yet. If you completed the payment it should appear shortly."
        : 'PayHere confirms payments with our server separately. This page updates automatically.'
    };
  }

  return (
    <div className="order-success container">
      <div className="order-success__hero">
        <span className="order-success__icon">{hero.ok ? <CheckCircleIcon size={44} /> : <AlertIcon size={44} />}</span>
        <h1>{hero.title}</h1>
        <p>{hero.text}</p>
        <p className="order-id">
          Order ID: <strong data-testid="order-id">{order._id}</strong>
        </p>
      </div>

      <div className="order-success__grid">
        <section className="panel" aria-labelledby="os-items">
          <h2 id="os-items">Order Summary</h2>
          <ul className="summary-items">
            {order.orderItems.map((item) => (
              <li key={item.product}>
                <span className="summary-items__img">{item.image ? <img src={item.image} alt="" /> : <ImageIcon size={22} />}</span>
                <span className="summary-items__name">
                  {item.name}
                  <small>
                    Qty {item.quantity} × {formatPrice(item.price)}
                  </small>
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.itemsPrice)}</dd>
            </div>
            {order.discountPrice > 0 && (
              <div className="totals__discount">
                <dt>Discount{order.promoCode ? ` (${order.promoCode})` : ''}</dt>
                <dd>-{formatPrice(order.discountPrice)}</dd>
              </div>
            )}
            <div>
              <dt>Shipping</dt>
              <dd>{order.shippingPrice === 0 ? 'Free' : formatPrice(order.shippingPrice)}</dd>
            </div>
            <div className="totals__grand">
              <dt>Total</dt>
              <dd data-testid="order-total">{formatPrice(order.totalPrice)}</dd>
            </div>
          </dl>
        </section>

        <section className="panel" aria-labelledby="os-details">
          <h2 id="os-details">Order Details</h2>
          <dl className="info-table">
            <div>
              <dt>Placed on</dt>
              <dd>{formatOrderDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{order.status}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod} &middot; {paymentStatusLabel(order)}              </dd>
            </div>
            {online && order.payhereAmount > 0 && (
              <div>
                <dt>Online payment amount</dt>
                <dd>{formatLkr(order.payhereAmount)}</dd>
              </div>
            )}
          </dl>
          {waiting && (
            <p className="notice notice--info" role="status">
              Not marked as paid until PayHere's confirmation reaches our server.{' '}
              <button type="button" className="link-btn" onClick={retry}>
                Check again
              </button>
            </p>
          )}
          <h3 className="panel__sub">Shipping to</h3>
          <address className="ship-address">
            {a.fullName}
            <br />
            {a.street}
            <br />
            {a.city}, {a.postalCode}
            <br />
            {a.province ? `${a.province} Province, ` : ''}{a.country}
            <br />
            {a.phone}
          </address>
        </section>
      </div>

      {payError && (
        <p className="error-msg" role="alert" style={{ textAlign: 'center' }}>
          {payError}
        </p>
      )}
      <div className="order-success__actions">
        {online && !paid && order.status !== 'Cancelled' && (failed || timedOut) && (
          <button type="button" className="btn btn-primary" onClick={payAgain} disabled={retrying}>
            {retrying ? 'Redirecting to PayHere...' : 'Pay with PayHere'}
          </button>
        )}
        <Link to="/orders" className={`btn ${online && !paid && (failed || timedOut) ? 'btn-outline' : 'btn-primary'}`}>
          View Order History
        </Link>
        <Link to="/shop" className="btn btn-outline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import { AuthContext } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { ImageIcon, AlertIcon } from '../components/Icons';
import { PAYMENT_LABELS, formatOrderDate, paymentStatusLabel } from '../lib/orderFormat';

// Same order view as the post-checkout success page, reached instead from Order History.
export default function OrderDetailPage() {
  const { id } = useParams();
  const { formatPrice } = useContext(StoreContext);
  const { user } = useContext(AuthContext);

  const [state, setState] = useState({ status: 'loading', order: null, error: '' });
  const [attempt, setAttempt] = useState(0);

  // Per product: 'review' (backend says this customer may review it), 'reviewed' (already has a review) or nothing.
  // Only asked for Delivered orders; the review API (not this page) decides eligibility.
  const [reviewState, setReviewState] = useState({});

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', order: null, error: '' });
    api
      .get(`/orders/${id}`)
      .then(({ data }) => !cancelled && setState({ status: 'ready', order: data, error: '' }))
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 404) setState({ status: 'notfound', order: null, error: '' });
        else setState({ status: 'error', order: null, error: getErrorMessage(err, 'Could not load this order.') });
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // Cancel (only offered before the order is shipped; the server enforces the same rule)
  const [cancelStep, setCancelStep] = useState('idle'); // idle | confirm | working
  const [cancelError, setCancelError] = useState('');

  const handleCancel = async () => {
    setCancelStep('working');
    setCancelError('');
    try {
      const { data } = await api.post(`/orders/${id}/cancel`);
      setState({ status: 'ready', order: data, error: '' });
      setCancelStep('idle');
    } catch (err) {
      setCancelError(getErrorMessage(err, 'We could not cancel this order. Please try again.'));
      setCancelStep('idle');
      // 409 = the order changed meanwhile (shipped, or already cancelled): show its real status
      if (err.response?.status === 409) retry();
    }
  };

  const loadedOrder = state.status === 'ready' ? state.order : null;

  useEffect(() => {
    setReviewState({});
    if (!loadedOrder || loadedOrder.status !== 'Delivered' || !user || String(loadedOrder.user) !== String(user._id)) return undefined;
    let cancelled = false;
    const ids = [...new Set(loadedOrder.orderItems.map((item) => String(item.product)))];
    Promise.all(
      ids.map((pid) =>
        api
          .get(`/products/${pid}/reviews/mine`)
          .then(({ data }) => [pid, data.review ? 'reviewed' : data.canReview ? 'review' : null])
          .catch(() => [pid, null]) // can't confirm -> no button
      )
    ).then((pairs) => !cancelled && setReviewState(Object.fromEntries(pairs)));
    return () => {
      cancelled = true;
    };
  }, [loadedOrder, user]);

  if (state.status === 'loading') {
    return (
      <div className="account-panel">
        <LoadingSpinner label="Loading order..." />
      </div>
    );
  }
  if (state.status === 'notfound') {
    return (
      <div className="account-panel">
        <EmptyState title="Order not found" message="We couldn't find that order on your account." action={{ label: 'Back to Order History', to: '/orders' }} />
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="account-panel">
        <EmptyState icon={<AlertIcon size={32} />} title="We couldn't load this order" message={state.error} action={{ label: 'Try again', onClick: retry }} />
      </div>
    );
  }

  const { order } = state;
  const a = order.shippingAddress;
  const canCancel = order.status === 'Pending' || order.status === 'Processing';

  return (
    <div className="account-panel">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/orders">Order History</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Order Details</span>
      </nav>

      <div className="order-detail-head">
        <div>
          <h1 className="page-title">Order Details</h1>
          <p className="order-id">
            Order ID: <strong data-testid="order-id">{order._id}</strong>
          </p>
        </div>
        <span className={`status-pill status-pill--${order.status.toLowerCase()}`}>{order.status}</span>
      </div>

      <div className="order-success__grid">
        <section className="panel" aria-labelledby="od-items">
          <h2 id="od-items">Items</h2>
          <ul className="summary-items">
            {order.orderItems.map((item) => (
              <li key={item.product}>
                <span className="summary-items__img">{item.image ? <img src={item.image} alt="" /> : <ImageIcon size={22} />}</span>
                <span className="summary-items__name">
                  {item.name}
                  <small>
                    Qty {item.quantity} × {formatPrice(item.price)}
                  </small>
                  {reviewState[String(item.product)] === 'review' && (
                    <Link to={`/products/${item.product}#reviews`} className="btn btn-outline btn-sm order-review">
                      Rate &amp; Review
                    </Link>
                  )}
                  {reviewState[String(item.product)] === 'reviewed' && (
                    <Link to={`/products/${item.product}#reviews`} className="order-review order-review--done">
                      &#10003; Reviewed
                    </Link>
                  )}
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

        <section className="panel" aria-labelledby="od-details">
          <h2 id="od-details">Order Details</h2>
          <dl className="info-table">
            <div>
              <dt>Placed on</dt>
              <dd>{formatOrderDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod} &middot; {paymentStatusLabel(order)}              </dd>
            </div>
          </dl>
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

      {cancelError && (
        <p className="error-msg" role="alert">
          {cancelError}
        </p>
      )}
      {canCancel && (
        <section className="panel order-cancel" aria-labelledby="od-cancel">
          <h2 id="od-cancel">Cancel this order</h2>
          {cancelStep === 'idle' ? (
            <>
              <p>You can cancel this order until it has been shipped. The items go back into stock.</p>
              <button type="button" className="btn btn-danger-outline" onClick={() => setCancelStep('confirm')}>
                Cancel Order
              </button>
            </>
          ) : (
            <div role="alertdialog" aria-labelledby="od-cancel-q">
              <p id="od-cancel-q">
                <strong>Cancel this order?</strong> This cannot be undone.
              </p>
              <div className="order-cancel__actions">
                <button type="button" className="btn btn-danger-outline" onClick={handleCancel} disabled={cancelStep === 'working'}>
                  {cancelStep === 'working' ? 'Cancelling...' : 'Yes, cancel order'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setCancelStep('idle')} disabled={cancelStep === 'working'}>
                  Keep order
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      {order.status === 'Shipped' && (
        <p className="notice notice--info" role="note">
          This order has been shipped, so it can no longer be cancelled.
        </p>
      )}
      {order.status === 'Cancelled' && (
        <p className="notice notice--warn" role="status" data-testid="order-cancelled-note">
          This order was cancelled
          {order.cancelledAt ? ` on ${formatOrderDate(order.cancelledAt)}` : ''}
          {order.cancelledBy === 'customer' ? ' at your request' : order.cancelledBy === 'admin' ? ' by the store' : ''}.
        </p>
      )}

      <p className="orders__back">
        <Link to="/orders">&larr; Back to Order History</Link>
      </p>
    </div>
  );
}
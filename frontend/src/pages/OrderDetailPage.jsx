import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import api, { getErrorMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { ImageIcon, AlertIcon } from '../components/Icons';
import { PAYMENT_LABELS, formatOrderDate } from '../lib/orderFormat';

// Same order view as the post-checkout success page, reached instead from Order History.
export default function OrderDetailPage() {
  const { id } = useParams();
  const { formatPrice } = useContext(StoreContext);
  const [state, setState] = useState({ status: 'loading', order: null, error: '' });
  const [attempt, setAttempt] = useState(0);

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
                {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod} &middot; {order.isPaid ? 'Paid' : 'Pay on delivery'}
              </dd>
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
            {a.country}
            <br />
            {a.phone}
          </address>
        </section>
      </div>

      <p className="orders__back">
        <Link to="/orders">&larr; Back to Order History</Link>
      </p>
    </div>
  );
}
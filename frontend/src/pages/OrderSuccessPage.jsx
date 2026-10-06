import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import api, { getErrorMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircleIcon, ImageIcon, AlertIcon } from '../components/Icons';
import { PAYMENT_LABELS, formatOrderDate } from '../lib/orderFormat';

export default function OrderSuccessPage() {
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
        else setState({ status: 'error', order: null, error: getErrorMessage(err, 'Could not load your order.') });
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

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

  return (
    <div className="order-success container">
      <div className="order-success__hero">
        <span className="order-success__icon">
          <CheckCircleIcon size={44} />
        </span>
        <h1>Thank you for your order!</h1>
        <p>Your order has been placed successfully.</p>
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
            {a.province ? `${a.province} Province, ` : ''}{a.country}
            <br />
            {a.phone}
          </address>
        </section>
      </div>

      <div className="order-success__actions">
        <Link to="/orders" className="btn btn-primary">
          View Order History
        </Link>
        <Link to="/shop" className="btn btn-outline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
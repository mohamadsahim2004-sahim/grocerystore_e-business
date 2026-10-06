import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import api, { getErrorMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { ImageIcon, AlertIcon } from '../components/Icons';
import { PAYMENT_LABELS, formatOrderDate, paymentStatusLabel } from '../lib/orderFormat';

// Same transition rules the server enforces (it always re-checks)
const ALLOWED_TRANSITIONS = {
  Pending: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
  Processing: ['Shipped', 'Delivered', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: []
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { formatPrice } = useContext(StoreContext);
  const [state, setState] = useState({ status: 'loading', order: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  const [nextStatus, setNextStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateNotice, setUpdateNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', order: null, error: '' });
    api
      .get(`/orders/${id}`)
      .then(({ data }) => {
        if (!cancelled) {
          setState({ status: 'ready', order: data, error: '' });
          setNextStatus(data.status);
        }
      })
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

  const handleUpdateStatus = async () => {
    setUpdating(true);
    setUpdateError('');
    setUpdateNotice('');
    try {
      const { data } = await api.put(`/admin/orders/${id}/status`, { status: nextStatus });
      setState({ status: 'ready', order: data, error: '' });
      setUpdateNotice(`Status updated to ${data.status}.`);
    } catch (err) {
      setUpdateError(getErrorMessage(err, 'Could not update the status.'));
      // 409 = the order changed meanwhile (for example the customer cancelled it): show its real state
      if (err.response?.status === 409) retry();
    } finally {
      setUpdating(false);
    }
  };

  if (state.status === 'loading') return <LoadingSpinner size="lg" label="Loading order..." />;
  if (state.status === 'notfound') {
    return <EmptyState title="Order not found" message="This order doesn't exist." action={{ label: 'Back to Orders', to: '/admin/orders' }} />;
  }
  if (state.status === 'error') {
    return <EmptyState icon={<AlertIcon size={32} />} title="We couldn't load this order" message={state.error} action={{ label: 'Try again', onClick: retry }} />;
  }

  const { order } = state;
  const a = order.shippingAddress;
  const allowedNext = ALLOWED_TRANSITIONS[order.status] || [];
  const isFinal = allowedNext.length === 0;

  return (
    <div className="admin-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin/orders">Orders</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">#{order._id.slice(-8).toUpperCase()}</span>
      </nav>

      <div className="order-detail-head">
        <div>
          <h1 className="page-title">Order Details</h1>
          <p className="order-id">
            Order ID: <strong>{order._id}</strong>
          </p>
        </div>
        <span className={`status-pill status-pill--${order.status.toLowerCase()}`}>{order.status}</span>
      </div>

      <div className="order-success__grid">
        <section className="panel" aria-labelledby="ao-items">
          <h2 id="ao-items">Items</h2>
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
              <dd>{formatPrice(order.totalPrice)}</dd>
            </div>
          </dl>
        </section>

        <section className="panel" aria-labelledby="ao-details">
          <h2 id="ao-details">Customer &amp; Shipping</h2>
          <dl className="info-table">
            <div>
              <dt>Customer</dt>
              <dd>{order.user?.name || a.fullName}</dd>
            </div>
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

      <section className="panel">
        <h2>Update Status</h2>
        {order.status === 'Cancelled' && (
          <p className="notice notice--warn" data-testid="admin-cancelled-note">
            Cancelled{order.cancelledBy === 'customer' ? ' by the customer' : order.cancelledBy === 'admin' ? ' by an admin' : ''}
            {order.cancelledAt ? ` on ${formatOrderDate(order.cancelledAt)}` : ''}.
            {order.stockRestored ? ' Its items were returned to stock.' : ''}
          </p>
        )}
        {isFinal ? (
          <p className="admin-empty-note">
            {order.status === 'Cancelled' ? 'This order is cancelled' : 'This order is delivered'} and can no longer be updated.
          </p>
        ) : (
          <div className="status-update">
            <select className="form-control" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
              {[order.status, ...allowedNext].map((s) => (
                <option key={s} value={s}>
                  {s === order.status ? `${s} (current)` : s}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-primary" disabled={updating || nextStatus === order.status} onClick={handleUpdateStatus}>
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        )}
        {nextStatus === 'Cancelled' && !isFinal && (
          <p className="notice notice--warn">Cancelling this order will restore its items to stock.</p>
        )}
        {updateNotice && <p className="success-msg">{updateNotice}</p>}
        {updateError && (
          <p className="error-msg" role="alert">
            {updateError}
          </p>
        )}
      </section>
    </div>
  );
}
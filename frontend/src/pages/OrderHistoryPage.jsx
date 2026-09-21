import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import api, { getErrorMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { AlertIcon, ImageIcon } from '../components/Icons';
import { PAYMENT_LABELS, formatOrderDate } from '../lib/orderFormat';

export default function OrderHistoryPage() {
  const { formatPrice } = useContext(StoreContext);
  const [state, setState] = useState({ status: 'loading', orders: [], error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, status: 'loading' }));
    api
      .get('/orders/my')
      .then(({ data }) => !cancelled && setState({ status: 'ready', orders: data, error: '' }))
      .catch((err) => !cancelled && setState({ status: 'error', orders: [], error: getErrorMessage(err, 'Could not load your orders.') }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return (
    <div className="container page-section orders">
      <h1 className="page-title">Order History</h1>

      {state.status === 'loading' && <LoadingSpinner label="Loading your orders..." />}
      {state.status === 'error' && (
        <EmptyState icon={<AlertIcon size={32} />} title="We couldn't load your orders" message={state.error} action={{ label: 'Try again', onClick: retry }} />
      )}
      {state.status === 'ready' && state.orders.length === 0 && (
        <EmptyState title="No orders yet" message="When you place an order it will show up here." action={{ label: 'Start Shopping', to: '/shop' }} />
      )}

      {state.status === 'ready' && state.orders.length > 0 && (
        <ul className="order-list">
          {state.orders.map((order) => (
            <li key={order._id} className="order-card" data-testid="order-card">
              <div className="order-card__head">
                <div>
                  <span className="order-card__label">Order ID</span>
                  <strong className="order-card__id">{order._id}</strong>
                </div>
                <span className={`status-pill status-pill--${order.status.toLowerCase()}`}>{order.status}</span>
              </div>
              <p className="order-card__meta">
                {formatOrderDate(order.createdAt)} &middot; {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                {order.isPaid ? ' · Paid' : ''}
              </p>
              <ul className="order-card__items">
                {order.orderItems.map((item) => (
                  <li key={item.product}>
                    <span className="summary-items__img">{item.image ? <img src={item.image} alt="" /> : <ImageIcon size={22} />}</span>
                    <span>
                      {item.name} <small>× {item.quantity}</small>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="order-card__foot">
                <span>Total</span>
                <strong>{formatPrice(order.totalPrice)}</strong>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="orders__back">
        <Link to="/shop">Continue Shopping</Link>
      </p>
    </div>
  );
}
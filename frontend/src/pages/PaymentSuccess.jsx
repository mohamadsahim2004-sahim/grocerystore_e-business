import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import api, { getErrorMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircleIcon, AlertIcon } from '../components/Icons';
import { PAYMENT_LABELS, formatLkr, formatOrderDate, paymentStatusLabel } from '../lib/orderFormat';
import { getPendingOrder, forgetPendingOrder } from '../lib/payhere';

const POLL_MS = 3000;
const MAX_POLLS = 10; // ~30 s: PayHere's server notification can arrive a moment after the browser redirect

// PayHere's return_url carries NO payment result. This page only reads what the backend has recorded
// (set exclusively by the verified PayHere notification) and never marks anything as paid itself.
export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { formatPrice } = useContext(StoreContext);
  const orderId = searchParams.get('order_id') || getPendingOrder();

  const [state, setState] = useState({ status: 'loading', order: null, error: '' });
  const [tick, setTick] = useState(0);
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (!orderId) return undefined;
    let cancelled = false;
    let timer;
    api
      .get(`/orders/${orderId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setState({ status: 'ready', order: data, error: '' });
        const settled = data.isPaid || ['Failed', 'Cancelled', 'Chargedback'].includes(data.paymentStatus) || data.status === 'Cancelled';
        if (settled) {
          if (data.isPaid) forgetPendingOrder();
        } else if (polls < MAX_POLLS) {
          timer = setTimeout(() => {
            setPolls((n) => n + 1);
            setTick((n) => n + 1);
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
    // polls is read, not a trigger: tick drives the refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, tick]);

  const checkAgain = useCallback(() => {
    setPolls(0);
    setTick((n) => n + 1);
  }, []);

  if (!orderId || state.status === 'notfound') {
    return (
      <div className="container page-section">
        <EmptyState title="No order to show" message="We couldn't find the order for this payment on your account." action={{ label: 'View Order History', to: '/orders' }} />
      </div>
    );
  }
  if (state.status === 'loading') {
    return (
      <div className="container page-section">
        <LoadingSpinner size="lg" label="Checking your payment..." />
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="container page-section">
        <EmptyState icon={<AlertIcon size={32} />} title="We couldn't load your order" message={state.error} action={{ label: 'Try again', onClick: checkAgain }} />
      </div>
    );
  }

  const { order } = state;
  const paid = order.isPaid;
  const failed = !paid && (['Failed', 'Cancelled', 'Chargedback'].includes(order.paymentStatus) || order.status === 'Cancelled');
  const waiting = !paid && !failed;
  const amount = typeof order.payhereAmount === 'number' && order.payhereAmount > 0 ? formatLkr(order.payhereAmount) : formatPrice(order.totalPrice);

  return (
    <div className="order-success container">
      <div className="order-success__hero">
        <span className="order-success__icon">{paid ? <CheckCircleIcon size={44} /> : <AlertIcon size={44} />}</span>
        <h1>{paid ? 'Payment successful' : failed ? 'Payment not completed' : 'Waiting for payment confirmation'}</h1>
        <p>
          {paid
            ? 'Thank you! PayHere has confirmed your payment.'
            : failed
              ? 'Your payment was not completed, so this order has not been paid.'
              : polls >= MAX_POLLS
                ? "We haven't received PayHere's confirmation yet. If you completed the payment it should appear shortly."
                : 'PayHere confirms payments with our server separately. This page updates automatically.'}
        </p>
        <p className="order-id">
          Order ID: <strong data-testid="order-id">{order._id}</strong>
        </p>
      </div>

      <section className="panel" aria-labelledby="ps-details" style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2 id="ps-details">Payment Details</h2>
        <dl className="info-table">
          <div>
            <dt>Amount</dt>
            <dd data-testid="payment-amount">{amount}</dd>
          </div>
          <div>
            <dt>Payment status</dt>
            <dd data-testid="payment-status">{paymentStatusLabel(order)}</dd>
          </div>
          <div>
            <dt>Order status</dt>
            <dd>{order.status}</dd>
          </div>
          <div>
            <dt>Payment method</dt>
            <dd>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</dd>
          </div>
          {paid && order.paidAt && (
            <div>
              <dt>Paid on</dt>
              <dd>{formatOrderDate(order.paidAt)}</dd>
            </div>
          )}
        </dl>
        {waiting && (
          <p className="notice notice--info" role="status">
            Not marked as paid until PayHere's confirmation reaches our server.{' '}
            <button type="button" className="link-btn" onClick={checkAgain}>
              Check again
            </button>
          </p>
        )}
      </section>

      <div className="order-success__actions">
        <Link to={`/orders/${order._id}`} className="btn btn-primary">
          View Order
        </Link>
        <Link to="/shop" className="btn btn-outline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
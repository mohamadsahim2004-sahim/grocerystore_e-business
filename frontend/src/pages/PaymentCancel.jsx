import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import api, { getErrorMessage } from '../api/client';
import { AlertIcon } from '../components/Icons';
import { formatLkr, paymentStatusLabel } from '../lib/orderFormat';
import { getPendingOrder, startPayHerePayment } from '../lib/payhere';

// Opened by PayHere's cancel_url (or by checkout when the payment could not be started).
// Nothing is changed here: an order only ever becomes paid through PayHere's verified server notification.
export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { formatPrice } = useContext(StoreContext);
  const orderId = searchParams.get('order_id') || getPendingOrder();
  const startFailed = searchParams.get('reason') === 'error';

  const [order, setOrder] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState(location.state?.message || '');

  useEffect(() => {
    if (!orderId) return undefined;
    let cancelled = false;
    api
      .get(`/orders/${orderId}`)
      .then(({ data }) => !cancelled && setOrder(data))
      .catch(() => {
        /* the page still works without the order details */
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const canRetry = order && order.paymentMethod === 'CARD' && !order.isPaid && order.status !== 'Cancelled';

  const retry = async () => {
    setError('');
    setRetrying(true);
    try {
      await startPayHerePayment(order._id); // leaves the page on success
    } catch (err) {
      setError(getErrorMessage(err, 'We could not restart the payment. Please try again.'));
      setRetrying(false);
    }
  };

  return (
    <div className="order-success container">
      <div className="order-success__hero">
        <span className="order-success__icon">
          <AlertIcon size={44} />
        </span>
        <h1>{startFailed ? "We couldn't start the payment" : 'Payment cancelled'}</h1>
        <p>
          Your payment was not completed and you have not been charged. {order?.isPaid ? '' : 'Your order is saved but is not paid yet.'}
        </p>
        {orderId && (
          <p className="order-id">
            Order ID: <strong data-testid="order-id">{orderId}</strong>
          </p>
        )}
      </div>

      {order && (
        <section className="panel" aria-labelledby="pc-details" style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 id="pc-details">Order</h2>
          <dl className="info-table">
            <div>
              <dt>Amount</dt>
              <dd>{typeof order.payhereAmount === 'number' && order.payhereAmount > 0 ? formatLkr(order.payhereAmount) : formatPrice(order.totalPrice)}</dd>
            </div>
            <div>
              <dt>Payment status</dt>
              <dd>{paymentStatusLabel(order)}</dd>
            </div>
          </dl>
        </section>
      )}

      {error && (
        <p className="error-msg" role="alert" style={{ textAlign: 'center' }}>
          {error}
        </p>
      )}

      <div className="order-success__actions">
        {canRetry && (
          <button type="button" className="btn btn-primary" onClick={retry} disabled={retrying}>
            {retrying ? 'Redirecting to PayHere...' : 'Try payment again'}
          </button>
        )}
        {orderId && order && (
          <Link to={`/orders/${order._id}`} className="btn btn-outline">
            View Order
          </Link>
        )}
        <Link to="/cart" className="btn btn-outline">
          Back to Cart
        </Link>
      </div>
    </div>
  );
}
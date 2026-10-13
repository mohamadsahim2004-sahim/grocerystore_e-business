import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import { getPendingOrder } from '../lib/payhere';

// PayHere's return_url carries NO payment result. This route only forwards to the Order Success page, which shows
// what the backend has recorded (set exclusively by PayHere's verified notification) and never marks anything paid.
export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id') || getPendingOrder();

  if (!/^[a-f0-9]{24}$/i.test(orderId)) {
    return (
      <div className="container page-section">
        <EmptyState title="No order to show" message="We couldn't find the order for this payment on your account." action={{ label: 'View Order History', to: '/orders' }} />
      </div>
    );
  }
  return <Navigate to={`/order-success/${orderId}`} replace />;
}
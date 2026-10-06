import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { AlertIcon } from '../components/Icons';
import { formatOrderDate } from '../lib/orderFormat';

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const ALLOWED_TRANSITIONS = {
  Pending: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
  Processing: ['Shipped', 'Delivered', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: []
};

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status') || '';
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);

  const [state, setState] = useState({ status: 'loading', orders: [], pages: 1, total: 0, error: '' });
  const [attempt, setAttempt] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [updateError, setUpdateError] = useState('');
  const [cancelModalOrder, setCancelModalOrder] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, status: 'loading' }));
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);

    api
      .get(`/admin/orders?${params.toString()}`)
      .then(({ data }) => !cancelled && setState({ status: 'ready', orders: data.orders, pages: data.pages, total: data.total, error: '' }))
      .catch((err) => !cancelled && setState({ status: 'error', orders: [], pages: 1, total: 0, error: getErrorMessage(err, 'Could not load orders.') }));

    return () => {
      cancelled = true;
    };
  }, [status, page, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const setFilter = (nextStatus) => {
    const params = new URLSearchParams();
    if (nextStatus) params.set('status', nextStatus);
    setSearchParams(params);
  };

  const goToPage = (n) => {
    const params = new URLSearchParams(searchParams);
    if (n === 1) params.delete('page');
    else params.set('page', String(n));
    setSearchParams(params);
  };

  const executeStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    setUpdateError('');

    // Save previous state for rollback
    const previousOrders = [...state.orders];

    // Optimistic update
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
    }));

    try {
      const { data: updatedOrder } = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => (o._id === orderId ? updatedOrder : o))
      }));
    } catch (err) {
      // Rollback on failure
      setState((prev) => ({ ...prev, orders: previousOrders }));
      setUpdateError(getErrorMessage(err, 'Failed to update order status.'));
      // 409 = the order changed meanwhile (for example the customer cancelled it): show the real state
      if (err.response?.status === 409) setAttempt((n) => n + 1);
    } finally {
      setUpdatingId(null);
      setCancelModalOrder(null);
    }
  };

  const handleStatusChange = (order, newStatus) => {
    if (newStatus === order.status) return;

    if (newStatus === 'Cancelled') {
      setCancelModalOrder({ order, nextStatus: newStatus });
      return;
    }

    executeStatusUpdate(order._id, newStatus);
  };

  return (
    <div className="admin-page">
      <h1 className="page-title">Orders</h1>

      {updateError && (
        <div className="admin-alert admin-alert--error" style={{ marginBottom: '1rem' }}>
          <span>{updateError}</span>
          <button type="button" className="admin-alert__close" onClick={() => setUpdateError('')}>
            &times;
          </button>
        </div>
      )}

      <div className="admin-toolbar">
        <select className="form-control" value={status} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {state.status === 'ready' && <span className="admin-toolbar__count">{state.total} orders</span>}
      </div>

      {state.status === 'loading' && <LoadingSpinner size="lg" label="Loading orders..." />}
      {state.status === 'error' && (
        <EmptyState icon={<AlertIcon size={32} />} title="We couldn't load orders" message={state.error} action={{ label: 'Try again', onClick: retry }} />
      )}
      {state.status === 'ready' && state.orders.length === 0 && <EmptyState title="No orders found" message="Try a different status filter." />}

      {state.status === 'ready' && state.orders.length > 0 && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--clickable">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {state.orders.map((order) => {
                  const allowedNext = ALLOWED_TRANSITIONS[order.status] || [];
                  const isTerminal = allowedNext.length === 0;
                  const isBusy = updatingId === order._id;

                  return (
                    <tr key={order._id} onClick={() => navigate(`/admin/orders/${order._id}`)}>
                      <td>
                        <Link to={`/admin/orders/${order._id}`} className="admin-id-link" onClick={(e) => e.stopPropagation()}>
                          #{order._id.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td>
                        {order.user?.name || 'Unknown'}
                        <br />
                        <span className="admin-muted">{order.user?.email}</span>
                      </td>
                      <td>{formatOrderDate(order.createdAt)}</td>
                      <td>{order.paymentMethod}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {isTerminal ? (
                          <>
                            <span className={`status-pill status-pill--${order.status.toLowerCase()}`}>{order.status}</span>
                            {order.status === 'Cancelled' && order.cancelledBy && (
                              <small className="admin-muted order-cancel-by">by {order.cancelledBy === 'customer' ? 'customer' : 'admin'}</small>
                            )}
                          </>
                        ) : (
                          <select
                            className={`status-pill status-pill--${order.status.toLowerCase()} status-pill--select`}
                            value={order.status}
                            disabled={isBusy}
                            onChange={(e) => handleStatusChange(order, e.target.value)}
                          >
                            <option value={order.status} disabled>
                              {order.status}
                            </option>
                            {allowedNext.map((nextStatus) => (
                              <option key={nextStatus} value={nextStatus}>
                                Set to {nextStatus}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="num">${order.totalPrice.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={state.pages} onChange={goToPage} />
        </>
      )}

      {cancelModalOrder && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Cancel Order #{cancelModalOrder.order._id.slice(-8).toUpperCase()}?</h3>
            <p>
              Cancelling this order will restore reserved product quantities back into active inventory. This action cannot be reversed.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn--outline" onClick={() => setCancelModalOrder(null)}>
                Keep Order
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => executeStatusUpdate(cancelModalOrder.order._id, 'Cancelled')}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
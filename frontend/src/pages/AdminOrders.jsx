import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { AlertIcon } from '../components/Icons';
import { formatOrderDate } from '../lib/orderFormat';

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status') || '';
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);

  const [state, setState] = useState({ status: 'loading', orders: [], pages: 1, total: 0, error: '' });
  const [attempt, setAttempt] = useState(0);

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

  return (
    <div className="admin-page">
      <h1 className="page-title">Orders</h1>

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
                {state.orders.map((order) => (
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
                    <td>
                      <span className={`status-pill status-pill--${order.status.toLowerCase()}`}>{order.status}</span>
                    </td>
                    <td className="num">${order.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={state.pages} onChange={goToPage} />
        </>
      )}
    </div>
  );
}
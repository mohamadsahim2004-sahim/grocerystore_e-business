import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import { AuthContext } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { AlertIcon } from '../components/Icons';
import { formatOrderDate } from '../lib/orderFormat';

export default function AdminUserDetail() {
  const { id } = useParams();
  const { formatPrice } = useContext(StoreContext);
  const { user: currentAdmin } = useContext(AuthContext);
  const [state, setState] = useState({ status: 'loading', user: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  const [nextRole, setNextRole] = useState('customer');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateNotice, setUpdateNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', user: null, error: '' });
    api
      .get(`/admin/users/${id}`)
      .then(({ data }) => {
        if (!cancelled) {
          setState({ status: 'ready', user: data, error: '' });
          setNextRole(data.role);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 404) setState({ status: 'notfound', user: null, error: '' });
        else setState({ status: 'error', user: null, error: getErrorMessage(err, 'Could not load this user.') });
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const isSelf = currentAdmin?._id === id;

  const handleUpdateRole = async () => {
    setUpdating(true);
    setUpdateError('');
    setUpdateNotice('');
    try {
      const { data } = await api.put(`/admin/users/${id}/role`, { role: nextRole });
      setState((prev) => ({ ...prev, user: { ...prev.user, role: data.role } }));
      setUpdateNotice(`Role updated to ${data.role}.`);
    } catch (err) {
      setUpdateError(getErrorMessage(err, 'Could not update the role.'));
    } finally {
      setUpdating(false);
    }
  };

  if (state.status === 'loading') return <LoadingSpinner size="lg" label="Loading user..." />;
  if (state.status === 'notfound') {
    return <EmptyState title="User not found" message="This user doesn't exist." action={{ label: 'Back to Users', to: '/admin/users' }} />;
  }
  if (state.status === 'error') {
    return <EmptyState icon={<AlertIcon size={32} />} title="We couldn't load this user" message={state.error} action={{ label: 'Try again', onClick: retry }} />;
  }

  const { user } = state;

  return (
    <div className="admin-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin/users">Users</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{user.name}</span>
      </nav>

      <div className="order-detail-head">
        <div>
          <h1 className="page-title">{user.name}</h1>
          <p className="account-panel__email">{user.email}</p>
        </div>
        <span className={`status-pill ${user.role === 'admin' ? 'status-pill--shipped' : 'status-pill--delivered'}`}>{user.role}</span>
      </div>

      <div className="order-success__grid">
        <section className="panel" aria-labelledby="au-orders">
          <h2 id="au-orders">Recent Orders</h2>
          {user.recentOrders.length === 0 ? (
            <p className="admin-empty-note">No orders yet.</p>
          ) : (
            <ul className="mini-order-list">
              {user.recentOrders.map((o) => (
                <li key={o._id}>
                  <Link to={`/admin/orders/${o._id}`} className="admin-id-link">
                    #{o._id.slice(-8).toUpperCase()}
                  </Link>
                  <span className={`status-pill status-pill--${o.status.toLowerCase()}`}>{o.status}</span>
                  <span>{formatPrice(o.totalPrice)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel" aria-labelledby="au-details">
          <h2 id="au-details">Account Details</h2>
          <dl className="info-table">
            <div>
              <dt>Phone</dt>
              <dd>{user.phone || '\u2013'}</dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>{formatOrderDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt>Orders</dt>
              <dd>{user.orderCount}</dd>
            </div>
            <div>
              <dt>Total spent</dt>
              <dd>{formatPrice(user.totalSpent)}</dd>
            </div>
          </dl>

          <h3 className="panel__sub">Role</h3>
          {isSelf ? (
            <p className="admin-empty-note">You cannot change your own role.</p>
          ) : (
            <div className="status-update">
              <select className="form-control" value={nextRole} onChange={(e) => setNextRole(e.target.value)}>
                <option value="customer">customer</option>
                <option value="admin">admin</option>
              </select>
              <button type="button" className="btn btn-primary" disabled={updating || nextRole === user.role} onClick={handleUpdateRole}>
                {updating ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          )}
          {updateNotice && <p className="success-msg">{updateNotice}</p>}
          {updateError && (
            <p className="error-msg" role="alert">
              {updateError}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
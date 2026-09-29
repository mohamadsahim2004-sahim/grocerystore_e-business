import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function AdminUser() {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [rowError, setRowError] = useState('');

  const load = useCallback(() => {
    let cancelled = false;
    setStatus('loading');
    setError('');
    api
      .get('/admin/users')
      .then(({ data }) => {
        if (!cancelled) {
          setUsers(data);
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Could not load users.'));
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load, attempt]);

  const updateUser = async (userId, patch) => {
    setUpdatingId(userId);
    setRowError('');
    try {
      const { data } = await api.put(`/admin/users/${userId}`, patch);
      setUsers((prev) => prev.map((u) => (u._id === data._id ? data : u)));
    } catch (err) {
      setRowError(getErrorMessage(err, 'Could not update user.'));
    } finally {
      setUpdatingId(null);
    }
  };

  if (status === 'loading') return <LoadingSpinner label="Loading users..." />;
  if (status === 'error') {
    return (
      <EmptyState
        title="Could not load users"
        message={error}
        action={{ label: 'Try again', onClick: () => setAttempt((n) => n + 1) }}
      />
    );
  }

  return (
    <div className="account-panel">
      <div className="account-panel__head admin-section__head">
        <div>
          <h1 className="page-title">Users ({users.length})</h1>
        </div>
      </div>

      {rowError && <p className="error-msg" role="alert">{rowError}</p>}

      {users.length === 0 ? (
        <EmptyState title="No users yet" message="Registered customers and admins will show up here." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Member Since</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = currentUser && String(currentUser._id) === String(u._id);
                return (
                  <tr key={u._id}>
                    <td>
                      {u.name}
                      {isSelf && <span className="admin-table__muted"> (you)</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <select
                        value={u.role}
                        disabled={updatingId === u._id || isSelf}
                        onChange={(e) => updateUser(u._id, { role: e.target.value })}
                        aria-label={`Role for ${u.name}`}
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-pill status-pill--${u.isActive === false ? 'cancelled' : 'delivered'}`}>
                        {u.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled={updatingId === u._id || isSelf}
                        onClick={() => updateUser(u._id, { isActive: u.isActive === false })}
                      >
                        {updatingId === u._id ? '...' : u.isActive === false ? 'Activate' : 'Deactivate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
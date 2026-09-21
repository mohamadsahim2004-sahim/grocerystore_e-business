import React, { useState, useContext } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const { user, loading, login } = useContext(AuthContext);
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/profile';

  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (or just signed in) -> go where the user was headed
  if (!loading && user) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(credentials.email, credentials.password);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Authentication &amp; Login</h2>
      {error && <p className="error-msg" role="alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" name="email" value={credentials.email} onChange={handleChange} autoComplete="email" required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" name="password" value={credentials.password} onChange={handleChange} autoComplete="current-password" required />
        </div>
        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Login'}
        </button>
      </form>
      <p>Don't have an account? <Link to="/register" state={location.state}>Register here</Link></p>
    </div>
  );
}
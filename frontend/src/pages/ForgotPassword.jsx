
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', {
        email
      });

      setMessage(response.data.message);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to process your request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Forgot Password?</h2>
      <p>Enter your account email to request a password-reset link.</p>

      {message && (
        <p className="success-msg" role="status">{message}</p>
      )}

      {error && (
        <p className="error-msg" role="alert">{error}</p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="forgot-email">Email Address</label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={254}
            required
          />
        </div>

        <button
          type="submit"
          className="primary-btn"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p><Link to="/login">Back to Login</Link></p>
    </div>
  );
}

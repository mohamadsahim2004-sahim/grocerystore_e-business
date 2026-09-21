import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Usage:
//   <Route element={<ProtectedRoute />}> ... </Route>               (logged-in users)
//   <Route element={<ProtectedRoute adminOnly />}> ... </Route>     (admins only)
//   <ProtectedRoute>{element}</ProtectedRoute>                      (inline guard)
export default function ProtectedRoute({ adminOnly = false, children }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div className="auth-loading">Checking your session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
}
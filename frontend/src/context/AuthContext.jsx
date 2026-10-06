import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import api, {
  getToken,
  setToken,
  clearToken,
  getErrorMessage,
  UNAUTHORIZED_EVENT
} from '../api/client';

export const AuthContext = createContext(null);

const toError = (error) => new Error(getErrorMessage(error));

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // True while a stored token is being verified against GET /auth/me
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // Restore the session from the stored JWT on app start
  useEffect(() => {
    if (!getToken()) return undefined;

    let cancelled = false;
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!cancelled) setUser(data.user);
      })
      .catch((error) => {
        // 401 already cleared the token via the API client
        if (!cancelled && error.response?.status === 401) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Token rejected by the API (expired/invalid) -> end the session
  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const register = useCallback(async ({ name, email, password, phone }) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password, phone });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw toError(error);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw toError(error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Logout is always completed locally, even if the server is unreachable
    }
    clearToken();
    setUser(null);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/profile');
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw toError(error);
    }
  }, []);

  const updateProfile = useCallback(async ({ name, email, phone }) => {
    try {
      const { data } = await api.put('/profile', { name, email, phone });
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw toError(error);
    }
  }, []);

  // Profile photo: the server returns the whole updated user, so every screen shows the new photo at once
  const updateAvatar = useCallback(async (avatar) => {
    try {
      const { data } = await api.put('/profile/avatar', { avatar });
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw toError(error);
    }
  }, []);

  const removeAvatar = useCallback(async () => {
    try {
      const { data } = await api.delete('/profile/avatar');
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw toError(error);
    }
  }, []);

  // Keep the signed-in user's saved addresses (used by Checkout, Settings) in step with the Addresses page
  const syncAddresses = useCallback((addresses) => {
    setUser((prev) => (prev ? { ...prev, addresses } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      register,
      login,
      logout,
      fetchProfile,
      updateProfile,
      updateAvatar,
      removeAvatar,
      syncAddresses
    }),
    [user, loading, register, login, logout, fetchProfile, updateProfile, updateAvatar, removeAvatar, syncAddresses]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
import axios from 'axios';

const TOKEN_KEY = 'exotic_token';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const UNAUTHORIZED_EVENT = 'exotic:unauthorized';

// Only the JWT is persisted client-side. Passwords are never stored.
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable */
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.request && !error?.response) {
    return 'Cannot reach the server. Please check your connection and try again.';
  }
  return error?.message || fallback;
};

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// An expired/invalid token on a protected call drops the session everywhere.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isCredentialCall = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isCredentialCall && getToken()) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default api;
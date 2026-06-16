import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const getApiBaseUrl = () => {
  if (window.location.port === '5173') {
    return `http://${window.location.hostname}/reclawatch/index.php/api`;
  }
  const pathParts = window.location.pathname.split('/');
  const projectFolder = pathParts[1] || 'reclawatch';
  return `${window.location.origin}/${projectFolder}/index.php/api`;
};

export const API_BASE_URL = getApiBaseUrl();

// Set axios defaults
axios.defaults.baseURL = API_BASE_URL;

// Configure axios request interceptor to attach JWT token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const validateToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/validate_token');
      if (response.data.valid) {
        setUser(response.data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Token validation failed:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateToken();
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const response = await axios.post('/login', { username, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      return user;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Login failed. Silakan periksa username dan password Anda.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, validateToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

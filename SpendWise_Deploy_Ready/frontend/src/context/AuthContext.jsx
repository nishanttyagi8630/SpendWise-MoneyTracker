// Authentication Context
// Provides user session state, login, register, and logout throughout the app.

import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('spendwise_token'));
  const [loading, setLoading] = useState(true);

  // Check existing token on initial load
  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem('spendwise_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response.success && response.user) {
          setUser(response.user);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    verifyAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem('spendwise_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  // Register handler
  const register = async (name, email, password) => {
    const res = await authApi.register(name, email, password);
    if (res.success && res.token) {
      localStorage.setItem('spendwise_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('spendwise_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

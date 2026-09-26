import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(api.getToken());
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'signup'
  const { addToast } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    const savedToken = api.getToken();
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.getCurrentUser();
      if (res && res.user) {
        setUser(res.user);
      } else {
        api.setToken(null);
        setUser(null);
        setToken('');
      }
    } catch (err) {
      console.warn('Failed to restore session:', err.message);
      api.setToken(null);
      setUser(null);
      setToken('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    try {
      const res = await api.auth.login({ email, password });
      api.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setAuthModalOpen(false);
      addToast({
        title: 'Welcome Back!',
        message: `Signed in as ${res.user.firstName} ${res.user.lastName}`,
        type: 'success',
      });
      return res;
    } catch (err) {
      addToast({
        title: 'Sign In Failed',
        message: err.message || 'Invalid email or password',
        type: 'error',
      });
      throw err;
    }
  };

  const signup = async (firstName, lastName, email, password) => {
    try {
      const res = await api.auth.signup({ firstName, lastName, email, password });
      api.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setAuthModalOpen(false);
      addToast({
        title: 'Account Created!',
        message: `Welcome to BidPulse, ${res.user.firstName}!`,
        type: 'success',
      });
      return res;
    } catch (err) {
      addToast({
        title: 'Registration Failed',
        message: err.message || 'Could not create account',
        type: 'error',
      });
      throw err;
    }
  };

  const logout = () => {
    api.setToken(null);
    setToken('');
    setUser(null);
    addToast({
      title: 'Signed Out',
      message: 'You have been successfully signed out.',
      type: 'info',
    });
  };

  const openLogin = () => {
    setAuthModalTab('login');
    setAuthModalOpen(true);
  };

  const openSignup = () => {
    setAuthModalTab('signup');
    setAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout,
        authModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openLogin,
        openSignup,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

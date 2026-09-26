import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Sparkles, Shield, KeyRound } from 'lucide-react';

export const AuthModal = () => {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    authModalTab, 
    setAuthModalTab, 
    login, 
    signup 
  } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!authModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await signup(signupFirstName, signupLastName, signupEmail, signupPassword);
    } catch (err) {
      setErrorMsg(err.message || 'Signup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (role) => {
    setErrorMsg('');
    if (role === 'buyer') {
      setLoginEmail('buyer@bidpulse.io');
      setLoginPassword('Password123!');
    } else {
      setLoginEmail('collector@bidpulse.io');
      setLoginPassword('Password123!');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <div className="auth-brand-badge">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>BidPulse Secure Access</span>
          </div>
          <button
            className="btn-modal-close"
            onClick={() => setAuthModalOpen(false)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs-row">
          <button
            type="button"
            className={`auth-tab-btn ${authModalTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setAuthModalTab('login');
              setErrorMsg('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${authModalTab === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setAuthModalTab('signup');
              setErrorMsg('');
            }}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="form-error-alert">
            <span>{errorMsg}</span>
          </div>
        )}

        {authModalTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Demo Quick Fill */}
            <div className="demo-accounts-box">
              <span className="demo-label">Quick test accounts:</span>
              <div className="demo-btns-row">
                <button
                  type="button"
                  className="btn-demo-pill"
                  onClick={() => fillDemoAccount('buyer')}
                >
                  Fill Buyer Account
                </button>
                <button
                  type="button"
                  className="btn-demo-pill"
                  onClick={() => fillDemoAccount('seller')}
                >
                  Fill Seller Account
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit-primary w-full"
              disabled={submitting}
            >
              {submitting ? 'Authenticating...' : 'Sign In to Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="auth-form">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <div className="input-with-icon">
                  <User className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Alex"
                    value={signupFirstName}
                    onChange={(e) => setSignupFirstName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <div className="input-with-icon">
                  <User className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Morgan"
                    value={signupLastName}
                    onChange={(e) => setSignupLastName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <KeyRound className="w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit-primary w-full"
              disabled={submitting}
            >
              {submitting ? 'Creating Profile...' : 'Register & Start Bidding'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

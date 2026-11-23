import React, { useState } from 'react';
import './Login.css';
import authService from '../services/authService';
import Toast from './Toast';

function Login({ onLogin, isAdmin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inlineNotice, setInlineNotice] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (inlineNotice) setInlineNotice(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setInlineNotice(null);

    try {
      if (isSignUp && !isAdmin) {
        // User registration
        if (!formData.name.trim()) {
          showToast('Please enter your full name.', 'error');
          setIsLoading(false);
          return;
        }
        
        if (formData.password.length < 6) {
          showToast('Password must be at least 6 characters long.', 'error');
          setIsLoading(false);
          return;
        }

        const result = await authService.register({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        });

        if (result.success) {
          const { token, user } = result.data;
          authService.setAuth({ token, user, userType: 'user' });
          showToast(`Welcome to SoleVibe, ${user.name}!`, 'success');
          setTimeout(() => onLogin(user, 'user'), 800);
        } else {
          if (result.message && result.message.includes('already exists')) {
            setInlineNotice({
              type: 'warning',
              text: 'This email is already registered. Please sign in instead.',
              action: 'SWITCH_TO_LOGIN'
            });
            showToast('Email already registered! Switched to sign in.', 'info');
          } else {
            showToast(`Registration failed: ${result.message || 'Please check your information.'}`, 'error');
          }
        }
      } else {
        // User / Admin login
        const result = await authService.login({
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        });

        if (result.success) {
          const { token, user } = result.data;
          
          // Check if admin trying to login to admin route
          if (isAdmin && user.role !== 'ADMIN') {
            showToast('Access denied! Administrator credentials required.', 'error');
            setIsLoading(false);
            return;
          }

          // Check if admin trying to login on customer route
          if (!isAdmin && user.role === 'ADMIN') {
            showToast('Admin account detected! Redirecting to admin workspace...', 'info');
            setTimeout(() => { window.location.href = '/admin'; }, 1500);
            setIsLoading(false);
            return;
          }

          const userType = user.role === 'ADMIN' ? 'admin' : 'user';
          authService.setAuth({ token, user, userType });
          showToast(`Welcome back, ${user.name}!`, 'success');
          setTimeout(() => onLogin(user, userType), 800);
        } else {
          if (result.message && result.message.includes('Invalid credentials')) {
            showToast('Invalid email or password. Please verify your credentials.', 'error');
          } else {
            showToast(`Sign in failed: ${result.message || 'Server connection error.'}`, 'error');
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      showToast('An error occurred during authentication. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.show} 
        onClose={hideToast}
        duration={3500}
      />
      
      <div className="login-card-container">
        <div className="login-card">
          {/* Header Brandmark */}
          <div className="login-brand-header">
            <span className="brand-icon">⚡</span>
            <h1 className="brand-wordmark">SOLEVIBE</h1>
            <p className="brand-tagline">
              {isAdmin ? 'ADMINISTRATIVE CONTROL PORTAL' : 'ATHLETE ACCESS & ACCOUNT PORTAL'}
            </p>
          </div>

          {/* Customer Segmented Tab Control */}
          {!isAdmin && (
            <div className="auth-segmented-tabs" role="tablist">
              <button 
                type="button" 
                role="tab"
                aria-selected={!isSignUp}
                className={`tab-btn ${!isSignUp ? 'active' : ''}`}
                onClick={() => { setIsSignUp(false); setInlineNotice(null); }}
              >
                SIGN IN
              </button>
              <button 
                type="button" 
                role="tab"
                aria-selected={isSignUp}
                className={`tab-btn ${isSignUp ? 'active' : ''}`}
                onClick={() => { setIsSignUp(true); setInlineNotice(null); }}
              >
                CREATE ACCOUNT
              </button>
            </div>
          )}

          {/* Inline Feedback Notice */}
          {inlineNotice && (
            <div className={`auth-inline-notice notice-${inlineNotice.type}`}>
              <span>{inlineNotice.text}</span>
              {inlineNotice.action === 'SWITCH_TO_LOGIN' && (
                <button 
                  type="button" 
                  className="btn-switch-action"
                  onClick={() => { setIsSignUp(false); setInlineNotice(null); }}
                >
                  Sign In Now →
                </button>
              )}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Full Name for Sign Up */}
            {!isAdmin && isSignUp && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-name">Full Name *</label>
                <input
                  id="auth-name"
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Morgan"
                  required
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>
            )}

            {/* Email Address */}
            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">Email Address *</label>
              <input
                id="auth-email"
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="athlete@solevibe.com"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* Password with Visibility Toggle */}
            <div className="form-group">
              <div className="label-row">
                <label className="form-label" htmlFor="auth-password">Password *</label>
                {isSignUp && <span className="helper-hint">Min 6 characters</span>}
              </div>
              <div className="password-input-wrapper">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-input password-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  minLength="6"
                  required
                  disabled={isLoading}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
                <button 
                  type="button" 
                  className="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex="-1"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button 
              type="submit" 
              className="btn-primary btn-auth-submit" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span>PROCESSING...</span>
                  <span className="btn-icon">⏳</span>
                </>
              ) : (
                <>
                  <span>{isAdmin ? 'SIGN IN TO ADMIN' : (isSignUp ? 'JOIN THE ROSTER' : 'ACCESS ACCOUNT')}</span>
                  <span className="btn-icon">→</span>
                </>
              )}
            </button>

            {/* Admin Access Notice */}
            {isAdmin && (
              <div className="admin-credentials-box">
                <span className="cred-badge">AUTHORIZED OPERATORS ONLY</span>
                <p>Access restricted to authorized SoleVibe store personnel.</p>
              </div>
            )}

            {/* Route Cross Links */}
            <div className="auth-footer-links">
              {!isAdmin ? (
                <p>
                  Store administrator?{' '}
                  <a href="/admin" className="auth-link">Operator Portal →</a>
                </p>
              ) : (
                <p>
                  Looking for the customer shop?{' '}
                  <a href="/" className="auth-link">← Return to Storefront</a>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;

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
  const [isLoading, setIsLoading] = useState(false);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp && !isAdmin) {
        // User registration
        if (!formData.name.trim()) {
          showToast('Please enter your name.', 'error');
          setIsLoading(false);
          return;
        }
        
        if (formData.password.length < 6) {
          showToast('Password must be at least 6 characters long.', 'error');
          setIsLoading(false);
          return;
        }

        const result = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });

        if (result.success) {
          const { token, user } = result.data;
          authService.setAuth({ token, user, userType: 'user' });
          showToast(`Welcome to SoleVibe, ${user.name}!`, 'success');
          setTimeout(() => onLogin(user, 'user'), 1000);
        } else {
          // More user-friendly error messages
          if (result.message && result.message.includes('already exists')) {
            const switchToLogin = window.confirm('📧 Email Already Registered!\n\nThis email address is already associated with an account.\n\n✅ Would you like to switch to login mode?\n\nClick "OK" to login, or "Cancel" to use a different email.');
            
            if (switchToLogin) {
              setIsSignUp(false);
              // Keep the email, clear other fields
              setFormData(prev => ({
                ...prev,
                name: '',
                password: ''
              }));
              showToast('Switched to login mode. Please enter your password.', 'info');
            } else {
              showToast('Please use a different email address.', 'warning');
            }
          } else if (result.message && result.message.includes('validation')) {
            showToast('Please check: Name (2+ chars), Valid email, Password (6+ chars)', 'error');
          } else {
            showToast(`Registration failed: ${result.message}`, 'error');
          }
        }
      } else {
        // User/Admin login
        const result = await authService.login({
          email: formData.email,
          password: formData.password
        });

        if (result.success) {
          const { token, user } = result.data;
          
          // Check if admin trying to login to admin route
          if (isAdmin && user.role !== 'ADMIN') {
            showToast('Access denied! Admin credentials required.', 'error');
            setIsLoading(false);
            return;
          }

          // Check if user trying to login to user route with admin account
          if (!isAdmin && user.role === 'ADMIN') {
            showToast('Admin account detected! Redirecting to admin portal...', 'info');
            setTimeout(() => { window.location.href = '/admin'; }, 2000);
            setIsLoading(false);
            return;
          }

          const userType = user.role === 'ADMIN' ? 'admin' : 'user';
          authService.setAuth({ token, user, userType });
          showToast(`Welcome back, ${user.name}!`, 'success');
          setTimeout(() => onLogin(user, userType), 1000);
        } else {
          if (result.message.includes('Invalid credentials')) {
            showToast('Invalid email or password! Please check your credentials.', 'error');
          } else {
            showToast(`Login failed: ${result.message || 'Please make sure the backend server and MongoDB are running.'}`, 'error');
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.show} 
        onClose={hideToast}
        duration={4000}
      />
      
      <div className="login-card">
        <div className="login-header">
          <h1>⚡ SOLEVIBE</h1>
          <p>Premium Performance Footwear</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>
            {isAdmin ? '🔐 Admin Login' : (isSignUp ? '📝 Create Account' : '👤 User Login')}
          </h2>

          {!isAdmin && isSignUp && (
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
                disabled={isLoading}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              minLength="6"
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? '⏳ Processing...' : 
              (isAdmin ? '🔓 Login as Admin' : (isSignUp ? '✨ Sign Up' : '🔓 Login'))}
          </button>

          {!isAdmin && (
            <div className="toggle-auth">
              <p>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button 
                  type="button" 
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={isLoading}
                >
                  {isSignUp ? 'Login' : 'Sign Up'}
                </button>
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="admin-hint">
              <small>⚠️ Admin Portal - Authorized Access Only</small>
              <small>Email: admin@zuxofit.com | Password: admin123</small>
            </div>
          )}

          {!isAdmin && (
            <div className="route-link">
              <small>
                Are you an admin? 
                <a href="/admin"> Access Admin Portal</a>
              </small>
            </div>
          )}

          {isAdmin && (
            <div className="route-link">
              <small>
                Back to 
                <a href="/"> User Portal</a>
              </small>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;

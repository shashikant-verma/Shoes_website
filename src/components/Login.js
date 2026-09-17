import React, { useState } from 'react';
import './Login.css';
import authService from '../services/authService';

function Login({ onLogin, isAdmin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
          alert('❌ Please enter your name.');
          setIsLoading(false);
          return;
        }
        
        if (formData.password.length < 6) {
          alert('❌ Password must be at least 6 characters long.');
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
          onLogin(user, 'user');
        } else {
          alert(`❌ Registration failed: ${result.message}`);
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
            alert('❌ Access denied! Admin credentials required.\n\nEmail: admin@zuxofit.com\nPassword: admin123');
            setIsLoading(false);
            return;
          }

          // Check if user trying to login to user route with admin account
          if (!isAdmin && user.role === 'ADMIN') {
            alert('❌ Admin account detected! Please use the admin portal.\n\nRedirecting to /admin...');
            window.location.href = '/admin';
            setIsLoading(false);
            return;
          }

          const userType = user.role === 'ADMIN' ? 'admin' : 'user';
          authService.setAuth({ token, user, userType });
          onLogin(user, userType);
        } else {
          if (result.message.includes('Invalid credentials')) {
            alert('❌ Invalid email or password!\n\nPlease check your credentials and try again.');
          } else {
            alert(`❌ Login failed: ${result.message}`);
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('❌ Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>⚡ KINETIC // STRIDE</h1>
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

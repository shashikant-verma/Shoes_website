import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin, isAdmin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [isSignUp, setIsSignUp] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isAdmin) {
      // Admin login - check against localStorage
      const admins = JSON.parse(localStorage.getItem('admins') || '[]');
      const admin = admins.find(a => a.email === formData.email && a.password === formData.password);
      
      if (admin) {
        onLogin({ email: admin.email, name: admin.name, id: admin.id }, 'admin');
      } else {
        alert('❌ Invalid admin credentials!\n\nEmail: admin@zuxofit.com\nPassword: admin123');
      }
    } else {
      // User login/signup
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      if (isSignUp) {
        // Sign up
        if (!formData.name.trim()) {
          alert('❌ Please enter your name.');
          return;
        }
        
        if (formData.password.length < 6) {
          alert('❌ Password must be at least 6 characters long.');
          return;
        }
        
        const existingUser = users.find(u => u.email === formData.email);
        if (existingUser) {
          alert('❌ Email already registered!\n\nPlease use the login form or try a different email.');
          setIsSignUp(false);
          // Clear form
          setFormData({ email: '', password: '', name: '' });
        } else {
          const newUser = {
            id: Date.now().toString(),
            email: formData.email,
            password: formData.password,
            name: formData.name
          };
          users.push(newUser);
          localStorage.setItem('users', JSON.stringify(users));
          onLogin(newUser, 'user');
        }
      } else {
        // Login
        const user = users.find(u => u.email === formData.email && u.password === formData.password);
        if (user) {
          onLogin(user, 'user');
        } else {
          // Check if user exists but password is wrong
          const userExists = users.find(u => u.email === formData.email);
          if (userExists) {
            alert('❌ Invalid password!\n\nPlease check your password and try again.');
          } else {
            alert('❌ No account found with this email!\n\nPlease sign up first to create an account.');
          }
        }
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🥾 ZUXOFIT</h1>
          <p>Step into Comfort & Style</p>
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
            />
          </div>

          <button type="submit" className="btn-login">
            {isAdmin ? '🔓 Login as Admin' : (isSignUp ? '✨ Sign Up' : '🔓 Login')}
          </button>

          {!isAdmin && (
            <div className="toggle-auth">
              <p>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button type="button" onClick={() => setIsSignUp(!isSignUp)}>
                  {isSignUp ? 'Login' : 'Sign Up'}
                </button>
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="admin-hint">
              <small>⚠️ Admin credentials are managed separately</small>
              <small>Contact system administrator for access</small>
            </div>
          )}

          {!isAdmin && (
            <div className="route-link">
              <small>
                Are you an admin? 
                <a href="/admin"> Click here to login</a>
              </small>
            </div>
          )}

          {isAdmin && (
            <div className="route-link">
              <small>
                Not an admin? 
                <a href="/"> Go to user login</a>
              </small>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;

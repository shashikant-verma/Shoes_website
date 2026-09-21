import React, { useState } from 'react';
import authService from '../services/authService';
import OrderHistory from './OrderHistory';
import AddressBook from './AddressBook';
import Wishlist from './Wishlist';
import NotificationCenter from './NotificationCenter';
import './CustomerAccount.css';

function CustomerAccount({ 
  currentUser, 
  onLogout, 
  orders = [], 
  wishlist = [], 
  onPageChange,
  onProductClick,
  onAddToCart,
  onRemoveFromWishlist,
  showToast 
}) {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile update state
  const [name, setName] = useState(currentUser?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMsg({ text: 'Name cannot be empty', type: 'error' });
      return;
    }

    setIsUpdatingProfile(true);
    setProfileMsg({ text: '', type: '' });

    const result = await authService.updateProfile({ name: name.trim() });
    setIsUpdatingProfile(false);

    if (result.success) {
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      if (showToast) showToast('Profile updated successfully!', 'success');
    } else {
      setProfileMsg({ text: result.message || 'Failed to update profile', type: 'error' });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ text: 'Please fill in all password fields', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters long', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match', type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordMsg({ text: '', type: '' });

    const result = await authService.updatePassword({ currentPassword, newPassword });
    setIsUpdatingPassword(false);

    if (result.success) {
      setPasswordMsg({ text: 'Password updated successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (showToast) showToast('Password updated successfully!', 'success');
    } else {
      setPasswordMsg({ text: result.message || 'Failed to update password', type: 'error' });
    }
  };

  return (
    <div className="customer-account-container page-container fade-in">
      <div className="account-header glass-panel">
        <div className="user-avatar-large">
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="user-header-info">
          <h1 className="headline-lg">{currentUser?.name || 'Customer Account'}</h1>
          <p className="user-email-subtitle">{currentUser?.email}</p>
          <span className="account-badge">VALUED MEMBER</span>
        </div>
      </div>

      <div className="account-layout">
        {/* Account Sidebar Navigation */}
        <aside className="account-sidebar glass-panel">
          <nav className="account-nav-menu">
            <button 
              className={`account-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="nav-icon">👤</span> My Profile
            </button>
            <button 
              className={`account-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <span className="nav-icon">📦</span> Order History
              {orders.length > 0 && <span className="nav-counter">{orders.length}</span>}
            </button>
            <button 
              className={`account-nav-item ${activeTab === 'wishlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('wishlist')}
            >
              <span className="nav-icon">♥</span> Saved Wishlist
              {wishlist.length > 0 && <span className="nav-counter">{wishlist.length}</span>}
            </button>
            <button 
              className={`account-nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <span className="nav-icon">📍</span> Address Book
            </button>
            <button 
              className={`account-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <span className="nav-icon">🔔</span> Notifications
            </button>
            <button 
              className="account-nav-item logout-btn"
              onClick={onLogout}
            >
              <span className="nav-icon">🚪</span> Sign Out
            </button>
          </nav>
        </aside>

        {/* Account Main Content Area */}
        <main className="account-main-content">
          {activeTab === 'profile' && (
            <div className="profile-section-wrapper fade-in">
              {/* Quick Account Summary Cards */}
              <div className="account-stats-grid">
                <div className="stat-card glass-panel" onClick={() => setActiveTab('orders')}>
                  <span className="stat-icon">📦</span>
                  <div className="stat-info">
                    <span className="stat-value">{orders.length}</span>
                    <span className="stat-label">Total Orders</span>
                  </div>
                </div>
                <div className="stat-card glass-panel" onClick={() => setActiveTab('wishlist')}>
                  <span className="stat-icon">♥</span>
                  <div className="stat-info">
                    <span className="stat-value">{wishlist.length}</span>
                    <span className="stat-label">Wishlist Items</span>
                  </div>
                </div>
                <div className="stat-card glass-panel" onClick={() => setActiveTab('addresses')}>
                  <span className="stat-icon">📍</span>
                  <div className="stat-info">
                    <span className="stat-value">Manage</span>
                    <span className="stat-label">Shipping Addresses</span>
                  </div>
                </div>
              </div>

              {/* Personal Details Form */}
              <div className="account-card glass-panel">
                <h2 className="card-title headline-md">Personal Information</h2>
                <form onSubmit={handleUpdateProfile} className="profile-form">
                  {profileMsg.text && (
                    <div className={`form-alert alert-${profileMsg.type}`}>
                      {profileMsg.text}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address (Primary)</label>
                    <input 
                      type="email" 
                      className="form-input disabled-input" 
                      value={currentUser?.email || ''} 
                      disabled
                    />
                    <small className="form-help-text">Email address cannot be changed.</small>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={isUpdatingProfile}
                    >
                      {isUpdatingProfile ? 'Saving...' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security & Password Form */}
              <div className="account-card glass-panel">
                <h2 className="card-title headline-md">Security & Password</h2>
                <form onSubmit={handleUpdatePassword} className="profile-form">
                  {passwordMsg.text && (
                    <div className={`form-alert alert-${passwordMsg.type}`}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={isUpdatingPassword}
                    >
                      {isUpdatingPassword ? 'Updating Password...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="fade-in">
              <OrderHistory orders={orders} />
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="fade-in">
              <Wishlist 
                wishlist={wishlist}
                onRemoveFromWishlist={onRemoveFromWishlist}
                onProductClick={onProductClick}
                onAddToCart={onAddToCart}
              />
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="fade-in">
              <AddressBook />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="fade-in">
              <NotificationCenter />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default CustomerAccount;

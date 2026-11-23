import React, { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import returnService from '../services/returnService';
import notificationService from '../services/notificationService';
import OrderHistory from './OrderHistory';
import AddressBook from './AddressBook';
import Wishlist from './Wishlist';
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

  // Returns & Refunds State
  const [myReturns, setMyReturns] = useState([]);
  const [loadingReturns, setLoadingReturns] = useState(false);

  // In-Account Notifications State
  const [accountNotifications, setAccountNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Load Customer Returns
  const loadReturns = useCallback(async () => {
    setLoadingReturns(true);
    try {
      const res = await returnService.getMyReturns();
      if (res.success && res.data?.data) {
        setMyReturns(res.data.data);
      }
    } catch (err) {
      console.error('Error loading returns:', err);
    } finally {
      setLoadingReturns(false);
    }
  }, []);

  // Load In-Account Notifications
  const loadNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const res = await notificationService.getNotifications({ limit: 30 });
      if (res.success && Array.isArray(res.data)) {
        setAccountNotifications(res.data);
        if (typeof res.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      }
    } catch (err) {
      console.error('Error loading account notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    loadReturns();
    loadNotifications();
  }, [loadReturns, loadNotifications]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMsg({ text: 'Full name cannot be empty', type: 'error' });
      return;
    }

    setIsUpdatingProfile(true);
    setProfileMsg({ text: '', type: '' });

    const result = await authService.updateProfile({ name: name.trim() });
    setIsUpdatingProfile(false);

    if (result.success) {
      setProfileMsg({ text: 'Profile name updated successfully!', type: 'success' });
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
      setPasswordMsg({ text: 'Password changed successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (showToast) showToast('Password changed successfully!', 'success');
    } else {
      setPasswordMsg({ text: result.message || 'Failed to update password', type: 'error' });
    }
  };

  const handleCancelReturn = async (returnId) => {
    if (!window.confirm('Are you sure you want to cancel this return request?')) return;
    try {
      const res = await returnService.cancelReturn(returnId);
      if (res.success) {
        if (showToast) showToast('Return request cancelled.', 'success');
        loadReturns();
      } else {
        if (showToast) showToast(res.message || 'Failed to cancel return request', 'error');
      }
    } catch {
      if (showToast) showToast('Error cancelling return request', 'error');
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setAccountNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setAccountNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        if (showToast) showToast('All notifications marked as read', 'info');
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getReturnStatusBadge = (status = 'REQUESTED') => {
    const s = status.toUpperCase();
    switch (s) {
      case 'APPROVED': return { label: 'APPROVED', className: 'status-approved' };
      case 'RECEIVED': return { label: 'RECEIVED', className: 'status-received' };
      case 'REFUNDED': return { label: 'REFUNDED', className: 'status-refunded' };
      case 'REJECTED': return { label: 'REJECTED', className: 'status-rejected' };
      case 'CANCELLED': return { label: 'CANCELLED', className: 'status-cancelled' };
      default: return { label: 'REQUESTED', className: 'status-requested' };
    }
  };

  const getNotificationIcon = (type = '') => {
    if (type.includes('PAYMENT') || type.includes('DELIVERED')) return '🎉';
    if (type.includes('SHIPPED')) return '🚚';
    if (type.includes('RETURN')) return '📦';
    if (type.includes('CART')) return '🛒';
    return '🔔';
  };

  return (
    <div className="customer-account-container page-container">
      {/* Account Header Hero */}
      <div className="account-header-card">
        <div className="user-avatar-circle">
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
        </div>
        <div className="user-header-info">
          <div className="title-row">
            <h1 className="account-hero-name">{currentUser?.name || 'Athlete Customer'}</h1>
            <span className="athlete-membership-badge">VERIFIED ATHLETE</span>
          </div>
          <p className="user-email-text">{currentUser?.email}</p>
        </div>
      </div>

      <div className="account-layout">
        {/* Account Sidebar Navigation */}
        <aside className="account-sidebar-card">
          <nav className="account-nav-menu" aria-label="Customer account menu">
            <button 
              type="button"
              className={`account-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-label">Overview & Profile</span>
            </button>

            <button 
              type="button"
              className={`account-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <span className="nav-icon">📦</span>
              <span className="nav-label">Order History</span>
              {orders.length > 0 && <span className="nav-counter">{orders.length}</span>}
            </button>

            <button 
              type="button"
              className={`account-nav-item ${activeTab === 'returns' ? 'active' : ''}`}
              onClick={() => setActiveTab('returns')}
            >
              <span className="nav-icon">↩️</span>
              <span className="nav-label">Returns & Refunds</span>
              {myReturns.length > 0 && <span className="nav-counter">{myReturns.length}</span>}
            </button>

            <button 
              type="button"
              className={`account-nav-item ${activeTab === 'wishlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('wishlist')}
            >
              <span className="nav-icon">♥</span>
              <span className="nav-label">Saved Wishlist</span>
              {wishlist.length > 0 && <span className="nav-counter">{wishlist.length}</span>}
            </button>

            <button 
              type="button"
              className={`account-nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <span className="nav-icon">📍</span>
              <span className="nav-label">Address Book</span>
            </button>

            <button 
              type="button"
              className={`account-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <span className="nav-icon">🔔</span>
              <span className="nav-label">Notifications</span>
              {unreadCount > 0 && <span className="nav-counter unread-counter">{unreadCount}</span>}
            </button>

            <div className="sidebar-divider"></div>

            <button 
              type="button"
              className="account-nav-item logout-nav-item"
              onClick={onLogout}
            >
              <span className="nav-icon">🚪</span>
              <span className="nav-label">Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Account Main Content Canvas */}
        <main className="account-main-canvas">
          {/* TAB 1: Profile & Security */}
          {activeTab === 'profile' && (
            <div className="profile-section-wrapper fade-in">
              {/* Quick Summary Cards Grid */}
              <div className="account-stats-grid">
                <div className="stat-card" onClick={() => setActiveTab('orders')} role="button" tabIndex="0">
                  <span className="stat-icon">📦</span>
                  <div className="stat-info">
                    <span className="stat-value">{orders.length}</span>
                    <span className="stat-label">Total Orders</span>
                  </div>
                </div>

                <div className="stat-card" onClick={() => setActiveTab('returns')} role="button" tabIndex="0">
                  <span className="stat-icon">↩️</span>
                  <div className="stat-info">
                    <span className="stat-value">{myReturns.length}</span>
                    <span className="stat-label">Returns & Claims</span>
                  </div>
                </div>

                <div className="stat-card" onClick={() => setActiveTab('wishlist')} role="button" tabIndex="0">
                  <span className="stat-icon">♥</span>
                  <div className="stat-info">
                    <span className="stat-value">{wishlist.length}</span>
                    <span className="stat-label">Saved Wishlist</span>
                  </div>
                </div>

                <div className="stat-card" onClick={() => setActiveTab('addresses')} role="button" tabIndex="0">
                  <span className="stat-icon">📍</span>
                  <div className="stat-info">
                    <span className="stat-value">Manage</span>
                    <span className="stat-label">Addresses</span>
                  </div>
                </div>
              </div>

              {/* Personal Information Form */}
              <div className="account-section-card">
                <h2 className="section-card-title">Personal Information</h2>
                <form onSubmit={handleUpdateProfile} className="account-form">
                  {profileMsg.text && (
                    <div className={`form-alert alert-${profileMsg.type}`}>
                      {profileMsg.text}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-name">Full Name</label>
                    <input 
                      id="profile-name"
                      type="text" 
                      className="form-input" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-email">Primary Email</label>
                    <input 
                      id="profile-email"
                      type="email" 
                      className="form-input disabled-input" 
                      value={currentUser?.email || ''} 
                      disabled
                    />
                    <small className="help-text">Email address is permanently bound to this account.</small>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={isUpdatingProfile}
                    >
                      {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Name'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password & Security Form */}
              <div className="account-section-card">
                <h2 className="section-card-title">Security & Credentials</h2>
                <form onSubmit={handleUpdatePassword} className="account-form">
                  {passwordMsg.text && (
                    <div className={`form-alert alert-${passwordMsg.type}`}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="curr-pass">Current Password</label>
                    <input 
                      id="curr-pass"
                      type="password" 
                      className="form-input" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-pass">New Password</label>
                      <input 
                        id="new-pass"
                        type="password" 
                        className="form-input" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="confirm-pass">Confirm New Password</label>
                      <input 
                        id="confirm-pass"
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
                      className="btn-secondary"
                      disabled={isUpdatingPassword}
                    >
                      {isUpdatingPassword ? 'Updating Password...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Order History */}
          {activeTab === 'orders' && (
            <div className="account-tab-pane fade-in">
              <OrderHistory orders={orders} />
            </div>
          )}

          {/* TAB 3: Returns & Refunds */}
          {activeTab === 'returns' && (
            <div className="account-tab-pane fade-in">
              <div className="account-section-card">
                <div className="card-top-row">
                  <div>
                    <h2 className="section-card-title">Returns & Wear Claims</h2>
                    <p className="section-subtitle">
                      Review all submitted return requests under SoleVibe's 7-Day Return Policy.
                    </p>
                  </div>
                </div>

                {loadingReturns ? (
                  <div className="tab-loading-state">Loading your return requests...</div>
                ) : myReturns.length === 0 ? (
                  <div className="tab-empty-state">
                    <span className="empty-state-icon">↩️</span>
                    <h3>No Active Return Requests</h3>
                    <p>You have not submitted any return claims. Eligible delivered shoes can be returned within 7 days of delivery from your Order History.</p>
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => setActiveTab('orders')}
                    >
                      View Past Orders
                    </button>
                  </div>
                ) : (
                  <div className="returns-list-grid">
                    {myReturns.map((ret) => {
                      const badge = getReturnStatusBadge(ret.status);
                      return (
                        <div key={ret._id} className="return-item-card">
                          <div className="return-header">
                            <div>
                              <span className="return-ref">RETURN #{ret._id?.slice(-8).toUpperCase()}</span>
                              <span className="return-date">
                                Requested on {new Date(ret.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <span className={`status-pill ${badge.className}`}>{badge.label}</span>
                          </div>

                          <div className="return-body">
                            <p><strong>Reason:</strong> {ret.reason?.replace(/_/g, ' ') || 'Return Requested'}</p>
                            {ret.description && <p className="return-desc">"{ret.description}"</p>}
                            {ret.refundAmount > 0 && (
                              <p className="return-refund">
                                <strong>Calculated Refund:</strong> ₹{ret.refundAmount.toLocaleString()}
                              </p>
                            )}
                          </div>

                          {ret.status === 'REQUESTED' && (
                            <div className="return-footer">
                              <button 
                                type="button" 
                                className="btn-cancel-return"
                                onClick={() => handleCancelReturn(ret._id)}
                              >
                                Cancel Return Request
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Saved Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="account-tab-pane fade-in">
              <Wishlist 
                wishlist={wishlist}
                onRemoveFromWishlist={onRemoveFromWishlist}
                onProductClick={onProductClick}
                onAddToCart={onAddToCart}
              />
            </div>
          )}

          {/* TAB 5: Address Book */}
          {activeTab === 'addresses' && (
            <div className="account-tab-pane fade-in">
              <AddressBook showToast={showToast} />
            </div>
          )}

          {/* TAB 6: In-Account Notifications Inbox */}
          {activeTab === 'notifications' && (
            <div className="account-tab-pane fade-in">
              <div className="account-section-card">
                <div className="card-top-row">
                  <div>
                    <h2 className="section-card-title">Notifications & Dispatch Updates</h2>
                    <p className="section-subtitle">Real-time alerts regarding your order status, shipping, and returns.</p>
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      type="button" 
                      className="btn-mark-all"
                      onClick={handleMarkAllNotificationsRead}
                    >
                      Mark All as Read ({unreadCount})
                    </button>
                  )}
                </div>

                {loadingNotifications ? (
                  <div className="tab-loading-state">Loading your notification alerts...</div>
                ) : accountNotifications.length === 0 ? (
                  <div className="tab-empty-state">
                    <span className="empty-state-icon">🔔</span>
                    <h3>No Notifications Yet</h3>
                    <p>You're all caught up! Order fulfillment and tracking alerts will be delivered here.</p>
                  </div>
                ) : (
                  <div className="notifications-inbox-list">
                    {accountNotifications.map((notif) => (
                      <div 
                        key={notif._id} 
                        className={`notification-inbox-item ${!notif.isRead ? 'unread' : ''}`}
                        onClick={() => !notif.isRead && handleMarkNotificationRead(notif._id)}
                      >
                        <span className="notif-badge-icon">{getNotificationIcon(notif.type)}</span>
                        <div className="notif-body">
                          <div className="notif-header-line">
                            <strong className="notif-title-text">{notif.title}</strong>
                            <span className="notif-time-stamp">
                              {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="notif-message-text">{notif.message}</p>
                        </div>
                        {!notif.isRead && (
                          <button 
                            type="button" 
                            className="btn-mark-single-read"
                            onClick={(e) => { e.stopPropagation(); handleMarkNotificationRead(notif._id); }}
                            title="Mark as read"
                          >
                            ●
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default CustomerAccount;

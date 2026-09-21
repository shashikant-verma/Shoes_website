import React, { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import authService from '../services/authService';
import './NotificationCenter.css';

/**
 * Toast Notification Center (Transient Floating Popups)
 */
function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };

    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, duration);

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  useEffect(() => {
    notificationManager.init(addNotification);
  }, [addNotification]);

  return (
    <div className="notification-center">
      {notifications.map(notification => (
        <ToastNotification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function ToastNotification({ notification, onClose }) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '✅';
    }
  };

  return (
    <div className={`notification notification-${notification.type}`}>
      <div className="notification-content">
        <span className="notification-icon">{getIcon()}</span>
        <span className="notification-message">{notification.message}</span>
      </div>
      <button className="notification-close" onClick={onClose} aria-label="Close notification">
        ✕
      </button>
    </div>
  );
}

// Global Toast Notification Manager
class NotificationManager {
  constructor() {
    this.addNotification = null;
  }

  init(addNotificationFn) {
    this.addNotification = addNotificationFn;
  }

  show(message, type = 'success', duration = 4000) {
    if (this.addNotification) {
      return this.addNotification(message, type, duration);
    }
    console.warn('Notification system not initialized');
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

export const notificationManager = new NotificationManager();

/**
 * Persistent Notification Bell & Dropdown Component
 */
export function NotificationBell({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  const isAuthenticated = authService.isAuthenticated();

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationService.getUnreadCount();
      if (res.success && typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      // Silent error polling catch
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getNotifications({ limit: 15 });
      if (res.success) {
        setNotifications(res.data || []);
        if (typeof res.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      } else {
        setError(res.message || 'Failed to load notifications');
      }
    } catch (err) {
      setError('Error fetching notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      notificationService.markAsRead(notif._id).catch(() => {});
      setNotifications(prev =>
        prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    setIsOpen(false);

    if (onNavigate) {
      if (notif.relatedResourceType === 'ORDER') onNavigate('orders');
      else if (notif.relatedResourceType === 'RETURN') onNavigate('returns');
      else if (notif.relatedResourceType === 'CART') onNavigate('cart');
      else if (notif.relatedResourceType === 'PRODUCT' && notif.recipientRole === 'ADMIN') onNavigate('admin-inventory');
    }
  };

  const getTypeIcon = (type) => {
    if (type.includes('PAYMENT_SUCCESS') || type.includes('DELIVERED') || type.includes('COMPLETED')) return '🎉';
    if (type.includes('CANCELLED') || type.includes('FAILED') || type.includes('REJECTED')) return '❌';
    if (type.includes('SHIPPED') || type.includes('DELIVERY')) return '🚚';
    if (type.includes('ABANDONED_CART')) return '🛒';
    if (type.includes('LOW_STOCK') || type.includes('OUT_OF_STOCK')) return '⚠️';
    if (type.includes('RETURN')) return '📦';
    return '🔔';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button
        className="notification-bell-btn"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="dropdown-content">
            {loading ? (
              <div className="notif-loading">Loading notifications...</div>
            ) : error ? (
              <div className="notif-error">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <span className="empty-bell">🔔</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              <ul className="notif-list">
                {notifications.map(n => (
                  <li
                    key={n._id}
                    className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <span className="notif-type-icon">{getTypeIcon(n.type)}</span>
                    <div className="notif-info">
                      <div className="notif-title-row">
                        <span className="notif-title">{n.title}</span>
                        <span className="notif-time">{formatDate(n.createdAt)}</span>
                      </div>
                      <p className="notif-msg">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <button
                        className="mark-read-dot"
                        title="Mark as read"
                        onClick={(e) => handleMarkAsRead(n._id, e)}
                      >
                        ●
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
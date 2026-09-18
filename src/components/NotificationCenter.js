import React, { useState, useCallback } from 'react';
import './NotificationCenter.css';

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove notification
    setTimeout(() => {
      removeNotification(id);
    }, duration);
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  return (
    <div className="notification-center">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function Notification({ notification, onClose }) {
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
      <button className="notification-close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}

// Create a global notification manager
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
export default NotificationCenter;
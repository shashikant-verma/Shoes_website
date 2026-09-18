import React, { useEffect, useState } from 'react';
import './Toast.css';

function Toast({ message, type = 'success', isVisible, onClose, duration = 3000 }) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      
      const timer = setTimeout(() => {
        setIsShowing(false);
        setTimeout(() => {
          onClose();
        }, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '✅';
    }
  };

  return (
    <div className={`toast toast-${type} ${isShowing ? 'toast-show' : 'toast-hide'}`}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={() => setIsShowing(false)}>
        ✕
      </button>
    </div>
  );
}

export default Toast;
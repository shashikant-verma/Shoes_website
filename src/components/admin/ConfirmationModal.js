import React from 'react';
import './ConfirmationModal.css';

const ConfirmationIcons = {
  Warning: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
  ),
  Info: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
  ),
  Success: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  Error: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
    </svg>
  )
};

function ConfirmationModal({
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // warning, info, success, danger
  onConfirm,
  onCancel,
  loading = false
}) {

  const getIcon = () => {
    switch (type) {
      case 'info':
        return <ConfirmationIcons.Info />;
      case 'success':
        return <ConfirmationIcons.Success />;
      case 'danger':
      case 'error':
        return <ConfirmationIcons.Error />;
      default:
        return <ConfirmationIcons.Warning />;
    }
  };

  const getIconClass = () => {
    switch (type) {
      case 'info':
        return 'confirmation-icon-info';
      case 'success':
        return 'confirmation-icon-success';
      case 'danger':
      case 'error':
        return 'confirmation-icon-danger';
      default:
        return 'confirmation-icon-warning';
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
      case 'error':
        return 'btn btn-danger';
      case 'success':
        return 'btn btn-success';
      case 'info':
        return 'btn btn-info';
      default:
        return 'btn btn-warning';
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-content">
          <div className={`confirmation-icon ${getIconClass()}`}>
            {getIcon()}
          </div>
          
          <div className="confirmation-text">
            <h3 className="confirmation-title">{title}</h3>
            <p className="confirmation-message">{message}</p>
          </div>
        </div>

        <div className="confirmation-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className={getConfirmButtonClass()}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
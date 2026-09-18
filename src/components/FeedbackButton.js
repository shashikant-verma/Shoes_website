import React, { useState, useEffect } from 'react';
import './FeedbackButton.css';

function FeedbackButton({ 
  children, 
  onClick, 
  className = '', 
  type = 'button',
  disabled = false,
  loading = false,
  success = false,
  variant = 'primary',
  size = 'md',
  ...props 
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (success && !showSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, showSuccess]);

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      setIsPressed(true);
      onClick(e);
      
      // Reset pressed state
      setTimeout(() => {
        setIsPressed(false);
      }, 150);
    }
  };

  const getButtonClass = () => {
    const baseClass = 'feedback-btn';
    const variantClass = `feedback-btn-${variant}`;
    const sizeClass = `feedback-btn-${size}`;
    const stateClasses = [];
    
    if (loading) stateClasses.push('feedback-btn-loading');
    if (showSuccess) stateClasses.push('feedback-btn-success');
    if (isPressed) stateClasses.push('feedback-btn-pressed');
    if (disabled) stateClasses.push('feedback-btn-disabled');
    
    return [baseClass, variantClass, sizeClass, ...stateClasses, className]
      .filter(Boolean)
      .join(' ');
  };

  const renderContent = () => {
    if (showSuccess) {
      return (
        <>
          <span className="feedback-btn-icon">✓</span>
          <span>SUCCESS!</span>
        </>
      );
    }
    
    if (loading) {
      return (
        <>
          <span className="feedback-btn-spinner">⏳</span>
          <span>Loading...</span>
        </>
      );
    }
    
    return children;
  };

  return (
    <button
      type={type}
      className={getButtonClass()}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
}

export default FeedbackButton;
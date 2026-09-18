import React, { useState, useEffect } from 'react';
import { checkBackendHealth } from '../services/api';
import './ConnectionStatus.css';

function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Initial check
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const healthy = await checkBackendHealth();
      setIsConnected(healthy);
      setLastCheck(new Date());
      
      if (healthy) {
        setRetryCount(0);
      } else {
        setRetryCount(prev => prev + 1);
      }
    } catch (error) {
      setIsConnected(false);
      setRetryCount(prev => prev + 1);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetryClick = () => {
    checkConnection();
  };

  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <div className="connection-status-overlay">
      <div className="connection-status-modal">
        <div className="connection-status-icon">
          {isChecking ? '🔄' : '⚠️'}
        </div>
        <h3>Backend Connection Lost</h3>
        <div className="connection-details">
          <p>Cannot connect to the SoleVibe backend server.</p>
          <ul>
            <li>Make sure MongoDB is running</li>
            <li>Ensure the API server is started on port 5001</li>
            <li>Check your network connection</li>
          </ul>
          {retryCount > 0 && (
            <p className="retry-info">
              Retry attempts: {retryCount} 
              {lastCheck && ` (Last check: ${lastCheck.toLocaleTimeString()})`}
            </p>
          )}
        </div>
        <div className="connection-actions">
          <button 
            className="retry-button" 
            onClick={handleRetryClick}
            disabled={isChecking}
          >
            {isChecking ? '🔄 Checking...' : '🔄 Retry Connection'}
          </button>
        </div>
        <div className="connection-help">
          <p><strong>Quick Fix:</strong></p>
          <code>npm run dev</code>
          <p>Or manually restart both servers:</p>
          <code>cd server && npm run dev</code><br/>
          <code>npm start</code>
        </div>
      </div>
    </div>
  );
}

export default ConnectionStatus;
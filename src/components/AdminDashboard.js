import React, { useState, useEffect } from 'react';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import ProductsManager from './admin/ProductsManager';
import Toast from './Toast';

function AdminDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Set up navigation handler
  useEffect(() => {
    window.AdminNavigationHandler = (sectionId) => {
      setActiveSection(sectionId);
    };
    
    return () => {
      delete window.AdminNavigationHandler;
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <ProductsManager />;
      case 'orders':
        return (
          <div className="coming-soon">
            <div className="coming-soon-icon">📋</div>
            <h3>Orders Management</h3>
            <p>Order management interface coming soon...</p>
          </div>
        );
      case 'customers':
        return (
          <div className="coming-soon">
            <div className="coming-soon-icon">👥</div>
            <h3>Customer Management</h3>
            <p>Customer management interface coming soon...</p>
          </div>
        );
      case 'categories':
        return (
          <div className="coming-soon">
            <div className="coming-soon-icon">🏷️</div>
            <h3>Category Management</h3>
            <p>Category management interface coming soon...</p>
          </div>
        );
      case 'inventory':
        return (
          <div className="coming-soon">
            <div className="coming-soon-icon">📦</div>
            <h3>Inventory Management</h3>
            <p>Inventory management interface coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="coming-soon">
            <div className="coming-soon-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Settings panel coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <AdminLayout
        currentUser={currentUser}
        onLogout={onLogout}
        activeSection={activeSection}
      >
        {renderContent()}
      </AdminLayout>

      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
        duration={4000}
      />

      <style jsx>{`
        .coming-soon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
          background: white;
          border-radius: 16px;
          border: 1px solid #e5e5e5;
          padding: 48px 24px;
        }
        
        .coming-soon-icon {
          font-size: 64px;
          margin-bottom: 24px;
          opacity: 0.5;
        }
        
        .coming-soon h3 {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin: 0 0 12px 0;
        }
        
        .coming-soon p {
          font-size: 16px;
          color: #666;
          margin: 0;
        }
      `}</style>
    </>
  );
}

export default AdminDashboard;

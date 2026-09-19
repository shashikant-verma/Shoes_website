import React, { useState, useEffect } from 'react';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import ProductsManager from './admin/ProductsManager';
import OrdersManager from './admin/OrdersManager';
import CustomersManager from './admin/CustomersManager';
import CategoriesManager from './admin/CategoriesManager';
import InventoryManager from './admin/InventoryManager';
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
        return <OrdersManager />;
      case 'customers':
        return <CustomersManager />;
      case 'categories':
        return <CategoriesManager />;
      case 'inventory':
        return <InventoryManager />;
      case 'settings':
        return (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '400px', textAlign: 'center', background: 'white', borderRadius: '16px',
            border: '1px solid #e5e5e5', padding: '48px 24px', margin: '2rem'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.4 }}>⚙️</div>
            <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#333', margin: '0 0 12px' }}>Settings</h3>
            <p style={{ fontSize: '16px', color: '#888', margin: 0 }}>Settings panel coming soon...</p>
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
    </>
  );
}

export default AdminDashboard;

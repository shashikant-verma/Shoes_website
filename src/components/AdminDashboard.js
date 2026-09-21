import React, { useState, useEffect, Suspense, lazy } from 'react';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import ProductsManager from './admin/ProductsManager';
import OrdersManager from './admin/OrdersManager';
import CustomersManager from './admin/CustomersManager';
import CategoriesManager from './admin/CategoriesManager';
import InventoryManager from './admin/InventoryManager';
import ReviewsManager from './admin/ReviewsManager';
import CouponsManager from './admin/CouponsManager';
import ReturnsManager from './admin/ReturnsManager';
import Toast from './Toast';

const AdminSettings = lazy(() => import('./admin/AdminSettings'));

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
      case 'returns':
        return <ReturnsManager />;
      case 'customers':
        return <CustomersManager />;
      case 'categories':
        return <CategoriesManager />;
      case 'inventory':
        return <InventoryManager />;
      case 'reviews':
        return <ReviewsManager />;
      case 'coupons':
        return <CouponsManager />;
      case 'settings':
        return (
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading Settings...</div>}>
            <AdminSettings showToast={showToast} />
          </Suspense>
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

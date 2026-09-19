import React, { useState, useEffect } from 'react';
import './AdminLayout.css';

// Admin Icons Component
const AdminIcons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  ),
  Products: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4zm0 2H4v14h16V6h-3v2a1 1 0 0 1-2 0V6H9v2a1 1 0 0 1-2 0V6zm2-2h6V3H9v1z"/>
    </svg>
  ),
  Orders: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zm16-8V6H8.023v2H18.8c.066 0 .133-.026.181-.077.046-.051.072-.121.072-.194zm0 5v-2H8.023v2H18.8c.066 0 .133-.026.181-.077.046-.051.072-.121.072-.194zm0 5v-2H8.023v2H18.8c.066 0 .133-.026.181-.077.046-.051.072-.121.072-.194z"/>
    </svg>
  ),
  Customers: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  ),
  Categories: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  Inventory: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
    </svg>
  ),
  Logout: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
    </svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  ),
  Notifications: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
    </svg>
  ),
  Menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5z"/>
    </svg>
  )
};

function AdminLayout({ children, currentUser, onLogout, activeSection = 'dashboard' }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
        setMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.admin-sidebar') && !event.target.closest('.mobile-menu-toggle')) {
        setMobileMenuOpen(false);
      }
      if (profileDropdownOpen && !event.target.closest('.admin-profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen, profileDropdownOpen]);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: AdminIcons.Dashboard },
    { id: 'products', label: 'Products', icon: AdminIcons.Products },
    { id: 'orders', label: 'Orders', icon: AdminIcons.Orders },
    { id: 'returns', label: 'Returns & Refunds', icon: AdminIcons.Orders },
    { id: 'customers', label: 'Customers', icon: AdminIcons.Customers },
    { id: 'categories', label: 'Categories', icon: AdminIcons.Categories },
    { id: 'inventory', label: 'Inventory', icon: AdminIcons.Inventory },
    { id: 'reviews', label: 'Reviews', icon: AdminIcons.Categories },
    { id: 'coupons', label: 'Coupons', icon: AdminIcons.Categories }
  ];

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleNavigation = (sectionId) => {
    // This will be handled by parent component
    if (window.AdminNavigationHandler) {
      window.AdminNavigationHandler(sectionId);
    }
    
    // Close mobile menu after navigation
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">⚡</div>
            {!sidebarCollapsed && (
              <div className="logo-text">
                <h1>SOLEVIBE</h1>
                <span>Admin Panel</span>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {navigationItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => handleNavigation(item.id)}
                title={sidebarCollapsed ? item.label : ''}
              >
                <item.icon />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          <div className="nav-section nav-section-bottom">
            <button
              className="nav-item"
              onClick={() => handleNavigation('settings')}
              title={sidebarCollapsed ? 'Settings' : ''}
            >
              <AdminIcons.Settings />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>

            <button
              className="nav-item nav-logout"
              onClick={onLogout}
              title={sidebarCollapsed ? 'Logout' : ''}
            >
              <AdminIcons.Logout />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-left">
            <button 
              className="mobile-menu-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <AdminIcons.Close /> : <AdminIcons.Menu />}
            </button>

            <div className="header-breadcrumb">
              <span className="breadcrumb-home">Home</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">
                {navigationItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="header-right">
            <div className="header-search">
              <AdminIcons.Search />
              <input 
                type="text" 
                placeholder="Search..." 
                className="search-input"
              />
            </div>

            <button className="header-notifications" title="Notifications">
              <AdminIcons.Notifications />
              <span className="notification-badge">3</span>
            </button>

            <div className="admin-profile-dropdown">
              <button 
                className="profile-trigger"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div className="profile-avatar">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span className="profile-name">{currentUser?.name || 'Admin'}</span>
                <AdminIcons.ChevronDown />
              </button>

              {profileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="dropdown-info">
                      <div className="dropdown-name">{currentUser?.name || 'Admin'}</div>
                      <div className="dropdown-email">{currentUser?.email || 'admin@example.com'}</div>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button className="dropdown-item" onClick={() => handleNavigation('settings')}>
                    <AdminIcons.Settings />
                    Settings
                  </button>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button className="dropdown-item dropdown-logout" onClick={onLogout}>
                    <AdminIcons.Logout />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="admin-content">
          {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}
    </div>
  );
}

export default AdminLayout;
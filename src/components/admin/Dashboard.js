import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import productService from '../../services/productService';
import orderService from '../../services/orderService';

// Dashboard Icons
const DashboardIcons = {
  TotalProducts: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
    </svg>
  ),
  ActiveProducts: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  Customers: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  ),
  Orders: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zm16-8V6H8.023v2H18.8c.066 0 .133-.026.181-.077.046-.051.072-.121.072-.194zm0 5v-2H8.023v2H18.8c.066 0 .133-.026.181-.077.046-.051.072-.121.072-.194zm0 5v-2H8.023v2H18.8c.066 0 .133-.026.181-.077.046-.051.072-.121.072-.194z"/>
    </svg>
  ),
  LowStock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
  ),
  Revenue: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
    </svg>
  ),
  TrendUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
    </svg>
  ),
  TrendDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z"/>
    </svg>
  ),
  EmptyBox: () => (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
};

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    customers: 0,
    orders: 0,
    lowStock: 0,
    revenue: 0,
    avgOrderValue: 0
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load products for stats
      const productsResult = await productService.getProducts({ limit: 100 });
      
      // Load orders
      const ordersResult = await orderService.getAllOrders({ limit: 10 });

      if (productsResult.success) {
        const products = productsResult.data.data || [];
        calculateProductStats(products);
      }

      if (ordersResult.success) {
        const orderData = ordersResult.data.data || [];
        setOrders(orderData);
        calculateOrderStats(orderData);
      } else {
        // If orders fail, set empty orders (this is expected if no orders exist)
        setOrders([]);
        calculateOrderStats([]);
      }

      setError(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateProductStats = (products) => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const lowStock = products.filter(p => p.stock <= 5).length;

    setStats(prev => ({
      ...prev,
      totalProducts,
      activeProducts,
      lowStock
    }));
  };

  const calculateOrderStats = (orderData) => {
    const orders = orderData.length;
    const revenue = orderData.reduce((sum, order) => sum + (order.total || 0), 0);
    const avgOrderValue = orders > 0 ? revenue / orders : 0;

    // For customers, we'll use a simple count based on unique users in orders
    // In a real app, you'd have a separate users API endpoint
    const uniqueUsers = new Set(orderData.map(order => order.user?._id || order.user)).size;

    setStats(prev => ({
      ...prev,
      orders,
      revenue,
      avgOrderValue,
      customers: uniqueUsers
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      processing: { label: 'Processing', className: 'status-processing' },
      shipped: { label: 'Shipped', className: 'status-shipped' },
      delivered: { label: 'Delivered', className: 'status-delivered' },
      cancelled: { label: 'Cancelled', className: 'status-cancelled' }
    };
    
    const config = statusConfig[status] || { label: status, className: 'status-default' };
    return (
      <span className={`status-badge ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Here's what's happening with your store.</p>
        </div>
        
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Here's what's happening with your store.</p>
        </div>
        
        <div className="dashboard-error">
          <div className="error-icon">⚠️</div>
          <h3>Unable to load dashboard</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadDashboardData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-primary">
            <DashboardIcons.TotalProducts />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{stats.totalProducts}</div>
            <div className="kpi-label">Total Products</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-success">
            <DashboardIcons.ActiveProducts />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{stats.activeProducts}</div>
            <div className="kpi-label">Active Products</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-info">
            <DashboardIcons.Customers />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{stats.customers}</div>
            <div className="kpi-label">Customers</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-secondary">
            <DashboardIcons.Orders />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{stats.orders}</div>
            <div className="kpi-label">Orders</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-warning">
            <DashboardIcons.LowStock />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{stats.lowStock}</div>
            <div className="kpi-label">Low Stock</div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="dashboard-row">
        <div className="dashboard-card sales-overview">
          <div className="card-header">
            <h3 className="card-title">Sales Overview</h3>
            {stats.orders > 0 && <span className="card-badge">{stats.orders} orders</span>}
          </div>
          <div className="card-content">
            {stats.orders > 0 ? (
              <div className="sales-metrics">
                <div className="sales-metric">
                  <div className="metric-icon">
                    <DashboardIcons.Revenue />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{formatCurrency(stats.revenue)}</div>
                    <div className="metric-label">Total Revenue</div>
                  </div>
                </div>
                <div className="sales-metric">
                  <div className="metric-icon">
                    <DashboardIcons.Orders />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{stats.orders}</div>
                    <div className="metric-label">Total Orders</div>
                  </div>
                </div>
                <div className="sales-metric">
                  <div className="metric-icon">
                    <DashboardIcons.TrendUp />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{formatCurrency(stats.avgOrderValue)}</div>
                    <div className="metric-label">Avg. Order Value</div>
                  </div>
                </div>
                <div className="sales-metric">
                  <div className="metric-icon">
                    <DashboardIcons.Customers />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{stats.customers}</div>
                    <div className="metric-label">Customers Served</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sales-placeholder">
                <div className="placeholder-icon">📊</div>
                <h4>No orders yet</h4>
                <p>Sales analytics will appear once your first order comes in.</p>
                <div className="store-health">
                  <div className="health-title">Store Health</div>
                  <div className="health-metrics">
                    <div className="health-metric">
                      <span className="hm-value">{stats.activeProducts}</span>
                      <span className="hm-label">Live Products</span>
                    </div>
                    <div className="health-divider"></div>
                    <div className="health-metric">
                      <span className={`hm-value ${stats.lowStock > 0 ? 'hm-warn' : 'hm-good'}`}>{stats.lowStock}</span>
                      <span className="hm-label">Low Stock</span>
                    </div>
                    <div className="health-divider"></div>
                    <div className="health-metric">
                      <span className="hm-value hm-good">{stats.activeProducts > 0 ? '✓' : '—'}</span>
                      <span className="hm-label">Store Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="dashboard-card recent-orders">
        <div className="card-header">
          <h3 className="card-title">Recent Orders</h3>
        </div>
        <div className="card-content">
          {orders.length > 0 ? (
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order._id}>
                      <td>
                        <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                      </td>
                      <td>
                        <div className="customer-info">
                          <span className="customer-name">
                            {order.user?.name || 'Guest User'}
                          </span>
                          <span className="customer-email">
                            {order.user?.email || 'No email'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="order-date">{formatDate(order.createdAt)}</span>
                      </td>
                      <td>
                        <span className="order-items">{order.items?.length || 0} items</span>
                      </td>
                      <td>
                        <span className="order-amount">{formatCurrency(order.total || 0)}</span>
                      </td>
                      <td>
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <DashboardIcons.EmptyBox />
              <h4>No orders yet</h4>
              <p>Order information will appear here once customers start placing orders.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
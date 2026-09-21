import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import analyticsService from '../../services/analyticsService';
import orderService from '../../services/orderService';

// Dashboard Icons
const DashboardIcons = {
  TotalProducts: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
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
  Revenue: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
    </svg>
  ),
  Refund: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
    </svg>
  ),
  AOV: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
    </svg>
  )
};

function Dashboard() {
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    netRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    avgOrderValue: 0,
    totalDiscounts: 0,
    totalRefunds: 0,
    totalRefundCount: 0
  });

  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [couponStats, setCouponStats] = useState({ summary: {}, data: [] });
  const [returnsStats, setReturnsStats] = useState({ byStatus: [], totalReturnRequests: 0, totalRefundAmount: 0 });
  const [inventoryStats, setInventoryStats] = useState({ totalProducts: 0, totalStock: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trendPeriod, setTrendPeriod] = useState('daily');
  const [exporting, setExporting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const getDateRangeParams = useCallback(() => {
    let start = startDate;
    let end = endDate;

    if (dateFilter !== 'custom') {
      const now = new Date();
      if (dateFilter === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        start = todayStr;
        end = todayStr;
      } else if (dateFilter === '7d') {
        const past = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
        start = past.toISOString().split('T')[0];
        end = now.toISOString().split('T')[0];
      } else if (dateFilter === '30d') {
        const past = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        start = past.toISOString().split('T')[0];
        end = now.toISOString().split('T')[0];
      } else if (dateFilter === 'this_month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        start = firstDay.toISOString().split('T')[0];
        end = now.toISOString().split('T')[0];
      } else if (dateFilter === 'last_month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        start = firstDay.toISOString().split('T')[0];
        end = lastDay.toISOString().split('T')[0];
      } else {
        start = '';
        end = '';
      }
    }

    const params = {};
    if (start) params.startDate = start;
    if (end) params.endDate = end;
    return params;
  }, [dateFilter, startDate, endDate]);

  const loadDashboardAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = getDateRangeParams();
      const trendParams = { ...params, period: trendPeriod };

      const [
        overviewRes,
        trendRes,
        topProdRes,
        categoryRes,
        couponRes,
        returnsRes,
        inventoryRes,
        ordersRes
      ] = await Promise.all([
        analyticsService.getOverview(params),
        analyticsService.getSalesTrend(trendParams),
        analyticsService.getTopProducts({ ...params, limit: 5 }),
        analyticsService.getCategoryPerformance(params),
        analyticsService.getCouponStats(params),
        analyticsService.getReturnsStats(params),
        analyticsService.getInventoryStats(),
        orderService.getAllOrders({ limit: 5 })
      ]);

      if (overviewRes.success && overviewRes.data?.data) {
        setOverview(overviewRes.data.data);
      }
      if (trendRes.success && trendRes.data?.data) {
        setSalesTrend(Array.isArray(trendRes.data.data) ? trendRes.data.data : []);
      }
      if (topProdRes.success && topProdRes.data?.data) {
        setTopProducts(Array.isArray(topProdRes.data.data) ? topProdRes.data.data : []);
      }
      if (categoryRes.success && categoryRes.data?.data) {
        setCategoryPerformance(Array.isArray(categoryRes.data.data) ? categoryRes.data.data : []);
      }
      if (couponRes.success && couponRes.data) {
        const couponsList = Array.isArray(couponRes.data.data)
          ? couponRes.data.data
          : (couponRes.data.data?.coupons || couponRes.data.coupons || []);
        setCouponStats({
          summary: couponRes.data.summary || couponRes.data.data?.summary || {},
          data: couponsList
        });
      }
      if (returnsRes.success && returnsRes.data?.data) {
        setReturnsStats(returnsRes.data.data);
      }
      if (inventoryRes.success && inventoryRes.data?.data) {
        setInventoryStats(inventoryRes.data.data);
      }
      if (ordersRes.success && ordersRes.data?.data) {
        setRecentOrders(Array.isArray(ordersRes.data.data) ? ordersRes.data.data : []);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load authoritative backend analytics');
    } finally {
      setLoading(false);
    }
  }, [getDateRangeParams, trendPeriod]);

  useEffect(() => {
    loadDashboardAnalytics();
  }, [loadDashboardAnalytics]);

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleExportCSV = async (type) => {
    setExporting(true);
    try {
      const params = getDateRangeParams();
      const res = await analyticsService.exportReport(type, params);
      if (res.success) {
        showToast(`CSV report exported successfully!`, 'success');
      } else {
        showToast(res.message || 'Export failed', 'error');
      }
    } catch {
      showToast('Error generating CSV export', 'error');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { label: 'Confirmed', className: 'status-processing' },
      processing: { label: 'Processing', className: 'status-processing' },
      shipped: { label: 'Shipped', className: 'status-shipped' },
      delivered: { label: 'Delivered', className: 'status-delivered' },
      cancelled: { label: 'Cancelled', className: 'status-cancelled' }
    };
    const config = statusConfig[status] || { label: status, className: 'status-default' };
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Analytics & Reports Dashboard</h1>
            <p className="dashboard-subtitle">Authoritative real-time store metrics & intelligence</p>
          </div>
        </div>
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Calculating backend analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Analytics & Reports Dashboard</h1>
            <p className="dashboard-subtitle">Authoritative real-time store metrics & intelligence</p>
          </div>
        </div>
        <div className="dashboard-error">
          <div className="error-icon">⚠️</div>
          <h3>Unable to load analytics</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadDashboardAnalytics}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const maxRevenueTrend = Math.max(...salesTrend.map(t => t.revenue), 1);

  return (
    <div className="dashboard">
      {/* Toast Alert */}
      {toast && (
        <div className={`dash-toast dash-toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header & Date Filter Bar */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Analytics & Reports Dashboard</h1>
          <p className="dashboard-subtitle">Authoritative backend store metrics & business performance</p>
        </div>

        <div className="dash-actions">
          <button
            className="btn btn-export"
            disabled={exporting}
            onClick={() => handleExportCSV('sales')}
          >
            📥 Export Sales CSV
          </button>
          <button
            className="btn btn-export"
            disabled={exporting}
            onClick={() => handleExportCSV('products')}
          >
            📦 Export Products CSV
          </button>
          <button className="btn btn-primary" onClick={loadDashboardAnalytics}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Date Filter Toolbar */}
      <div className="dash-filter-bar">
        <div className="dash-filter-buttons">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'custom', label: 'Custom Range' }
          ].map(f => (
            <button
              key={f.id}
              className={`filter-tab ${dateFilter === f.id ? 'active' : ''}`}
              onClick={() => setDateFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="dash-custom-dates">
            <input
              type="date"
              className="dash-date-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <span className="date-sep">to</span>
            <input
              type="date"
              className="dash-date-input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
            <button className="btn btn-sm" onClick={loadDashboardAnalytics}>Apply</button>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-success">
            <DashboardIcons.Revenue />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{formatCurrency(overview.totalRevenue)}</div>
            <div className="kpi-label">Gross Revenue</div>
            <div className="kpi-subtext">Net: {formatCurrency(overview.netRevenue)}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-secondary">
            <DashboardIcons.Orders />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{overview.totalOrders}</div>
            <div className="kpi-label">Total Orders</div>
            <div className="kpi-subtext">Discounts: {formatCurrency(overview.totalDiscounts)}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-info">
            <DashboardIcons.Customers />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{overview.totalCustomers}</div>
            <div className="kpi-label">Registered Customers</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-primary">
            <DashboardIcons.AOV />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{formatCurrency(overview.avgOrderValue)}</div>
            <div className="kpi-label">Average Order Value (AOV)</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-warning">
            <DashboardIcons.Refund />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{formatCurrency(overview.totalRefunds)}</div>
            <div className="kpi-label">Total Refunds Issued</div>
            <div className="kpi-subtext">{overview.totalRefundCount || 0} completed refunds</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-primary">
            <DashboardIcons.TotalProducts />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{inventoryStats.totalProducts}</div>
            <div className="kpi-label">Catalog Products</div>
            <div className="kpi-subtext">Low/OOS: {inventoryStats.lowStockCount + inventoryStats.outOfStockCount}</div>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="dashboard-grid">
        {/* Sales Trend Chart */}
        <div className="dashboard-card card-wide">
          <div className="card-header">
            <div>
              <h2 className="card-title">Sales & Revenue Trend</h2>
              <p className="card-subtitle">Authoritative date-grouped revenue metrics</p>
            </div>
            <div className="trend-period-toggle">
              {['daily', 'weekly', 'monthly'].map(p => (
                <button
                  key={p}
                  className={`period-btn ${trendPeriod === p ? 'active' : ''}`}
                  onClick={() => setTrendPeriod(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="card-content">
            {salesTrend.length === 0 ? (
              <div className="dash-empty-state">
                <p>No sales recorded for the selected period.</p>
              </div>
            ) : (
              <div className="sales-chart-wrap">
                <div className="chart-bars-container">
                  {salesTrend.map(t => {
                    const heightPct = Math.max(8, Math.min(100, (t.revenue / maxRevenueTrend) * 100));
                    return (
                      <div key={t.date} className="chart-bar-col">
                        <div className="bar-tooltip">
                          <strong>{t.date}</strong><br />
                          Revenue: {formatCurrency(t.revenue)}<br />
                          Orders: {t.orderCount}
                        </div>
                        <div
                          className="chart-bar-fill"
                          style={{ height: `${heightPct}%` }}
                        ></div>
                        <span className="chart-label">{t.date.slice(-5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Performance Breakdown */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Category Performance</h2>
          </div>
          <div className="card-content">
            {categoryPerformance.length === 0 ? (
              <div className="dash-empty-state"><p>No category data available.</p></div>
            ) : (
              <div className="category-perf-list">
                {categoryPerformance.map(cat => (
                  <div key={cat.category} className="cat-item-row">
                    <div className="cat-info">
                      <span className="cat-name">{cat.category.toUpperCase()}</span>
                      <span className="cat-sales">{cat.unitsSold} units • {formatCurrency(cat.revenue)}</span>
                    </div>
                    <div className="cat-bar-bg">
                      <div
                        className="cat-bar-fill"
                        style={{
                          width: `${Math.min(100, (cat.revenue / (overview.totalRevenue || 1)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Analytics Grid: Top Products & Coupon Performance */}
      <div className="dashboard-grid">
        {/* Top-Selling Products */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Top-Selling Products</h2>
          </div>
          <div className="card-content">
            {topProducts.length === 0 ? (
              <div className="dash-empty-state"><p>No product sales recorded yet.</p></div>
            ) : (
              <table className="dash-mini-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Gross Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map(prod => (
                    <tr key={prod._id}>
                      <td>
                        <div className="dash-prod-cell">
                          {prod.image && <img src={prod.image} alt={prod.name} className="dash-prod-thumb" />}
                          <div>
                            <div className="dash-prod-name">{prod.name}</div>
                            <div className="dash-prod-cat">{prod.category || 'Footwear'}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="units-pill">{prod.unitsSold}</span></td>
                      <td><strong>{formatCurrency(prod.grossSales)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Coupon Performance */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Coupon Analytics</h2>
          </div>
          <div className="card-content">
            {(!Array.isArray(couponStats.data) || couponStats.data.length === 0) ? (
              <div className="dash-empty-state"><p>No coupon orders recorded yet.</p></div>
            ) : (
              <table className="dash-mini-table">
                <thead>
                  <tr>
                    <th>Coupon Code</th>
                    <th>Orders</th>
                    <th>Discount Total</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(couponStats.data) ? couponStats.data : []).map(c => (
                    <tr key={c.code}>
                      <td><span className="coupon-code-tag">{c.code}</span></td>
                      <td>{c.usageCount}</td>
                      <td><span className="discount-tag">-{formatCurrency(c.totalDiscountAmount)}</span></td>
                      <td><strong>{formatCurrency(c.associatedRevenue)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Returns & Refunds Breakdown */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Returns & Refunds Breakdown</h2>
          </div>
          <div className="card-content">
            {(!returnsStats.byStatus || returnsStats.byStatus.length === 0) ? (
              <div className="dash-empty-state"><p>No return requests logged.</p></div>
            ) : (
              <table className="dash-mini-table">
                <thead>
                  <tr>
                    <th>Return Status</th>
                    <th>Requests</th>
                    <th>Qty</th>
                    <th>Refund Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {returnsStats.byStatus.map(r => (
                    <tr key={r.status}>
                      <td><span className="status-pill">{r.status}</span></td>
                      <td>{r.count}</td>
                      <td>{r.returnedQuantity}</td>
                      <td><strong>{formatCurrency(r.refundAmount)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="dashboard-card card-full">
        <div className="card-header">
          <h2 className="card-title">Recent Customer Orders</h2>
        </div>
        <div className="card-content">
          {recentOrders.length === 0 ? (
            <div className="dash-empty-state"><p>No recent orders found.</p></div>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order._id}>
                    <td><span className="order-id">#{order._id.slice(-8).toUpperCase()}</span></td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">{order.user?.name || 'Customer'}</div>
                        <div className="customer-email">{order.user?.email || '—'}</div>
                      </div>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td><span className="order-total">{formatCurrency(order.subtotal - order.discount + order.shipping)}</span></td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <span className={`payment-status ${order.payment?.status === 'PAID' ? 'paid' : 'pending'}`}>
                        {order.payment?.status || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
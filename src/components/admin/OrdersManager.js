import React, { useState, useEffect } from 'react';
import './OrdersManager.css';
import orderService from '../../services/orderService';

const StatusIcon = ({ status }) => {
  const icons = {
    processing: '🔄',
    shipped: '🚚',
    delivered: '✅',
    cancelled: '❌'
  };
  return <span>{icons[status] || '📦'}</span>;
};

function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [toast, setToast] = useState(null);

  const ORDERS_PER_PAGE = 10;

  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const filters = { page: currentPage, limit: ORDERS_PER_PAGE };
      if (statusFilter) filters.status = statusFilter;

      const result = await orderService.getAllOrders(filters);
      if (result.success) {
        setOrders(result.data.data || []);
        setTotalPages(result.data.totalPages || 1);
        setTotalOrders(result.data.total || 0);
        setError(null);
      } else {
        setError(result.message);
        setOrders([]);
      }
    } catch (err) {
      setError('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    try {
      const result = await orderService.updateOrderStatus(orderId, newStatus);
      if (result.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
        showToast('Order status updated!', 'success');
      } else {
        showToast(result.message || 'Failed to update status', 'error');
      }
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o._id?.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q)
    );
  });

  const statusOptions = ['processing', 'shipped', 'delivered', 'cancelled'];

  const getStatusClass = (status) => ({
    processing: 'status-processing',
    shipped: 'status-shipped',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled'
  }[status] || 'status-default');

  const statsCounts = {
    all: totalOrders,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div className="om-page">
      {/* Toast */}
      {toast && (
        <div className={`om-toast om-toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="om-header">
        <div>
          <h1 className="om-title">Orders</h1>
          <p className="om-subtitle">{totalOrders} total order{totalOrders !== 1 ? 's' : ''}</p>
        </div>
        <button className="om-refresh-btn" onClick={loadOrders}>
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="om-status-tabs">
        {[{ key: '', label: 'All', count: totalOrders }, ...statusOptions.map(s => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1), count: statsCounts[s] }))].map(tab => (
          <button
            key={tab.key}
            className={`om-tab ${statusFilter === tab.key ? 'active' : ''}`}
            onClick={() => { setStatusFilter(tab.key); setCurrentPage(1); }}
          >
            {tab.label}
            <span className="om-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="om-toolbar">
        <div className="om-search">
          <span className="om-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by Order ID, customer name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="om-search-input"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="om-loading">
          <div className="om-spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : error ? (
        <div className="om-error">
          <span>⚠️</span>
          <h3>{error}</h3>
          <button onClick={loadOrders}>Try Again</button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="om-empty">
          <div className="om-empty-icon">📋</div>
          <h3>No orders found</h3>
          <p>
            {statusFilter ? `No ${statusFilter} orders yet.` : 'No orders have been placed yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="om-table-wrap">
            <table className="om-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order._id} className="om-row" onClick={() => setSelectedOrder(order)}>
                    <td>
                      <span className="om-order-id">#{order._id.slice(-8).toUpperCase()}</span>
                    </td>
                    <td>
                      <div className="om-customer">
                        <div className="om-avatar">{(order.user?.name || 'G')[0].toUpperCase()}</div>
                        <div>
                          <div className="om-customer-name">{order.user?.name || 'Guest'}</div>
                          <div className="om-customer-email">{order.user?.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="om-date">{formatDate(order.createdAt)}</span></td>
                    <td><span className="om-items">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</span></td>
                    <td><span className="om-amount">{formatCurrency(order.total)}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        className={`om-status-select ${getStatusClass(order.status)}`}
                        value={order.status}
                        disabled={updatingStatus === order._id}
                        onChange={e => handleStatusUpdate(order._id, e.target.value)}
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="om-view-btn" onClick={() => setSelectedOrder(order)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="om-pagination">
              <button
                className="om-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >← Prev</button>
              <span className="om-page-info">Page {currentPage} of {totalPages}</span>
              <button
                className="om-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >Next →</button>
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="om-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="om-modal" onClick={e => e.stopPropagation()}>
            <div className="om-modal-header">
              <div>
                <h2>Order #{selectedOrder._id.slice(-8).toUpperCase()}</h2>
                <p>{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button className="om-modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="om-modal-body">
              {/* Customer Info */}
              <div className="om-detail-section">
                <h3>Customer</h3>
                <div className="om-detail-row">
                  <span>Name</span><span>{selectedOrder.user?.name || 'Guest'}</span>
                </div>
                <div className="om-detail-row">
                  <span>Email</span><span>{selectedOrder.user?.email || '—'}</span>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="om-detail-section">
                  <h3>Shipping Address</h3>
                  <div className="om-address">
                    {selectedOrder.shippingAddress.street && <div>{selectedOrder.shippingAddress.street}</div>}
                    {selectedOrder.shippingAddress.city && <div>{selectedOrder.shippingAddress.city}{selectedOrder.shippingAddress.state ? `, ${selectedOrder.shippingAddress.state}` : ''} {selectedOrder.shippingAddress.pincode}</div>}
                    {selectedOrder.shippingAddress.country && <div>{selectedOrder.shippingAddress.country}</div>}
                    {selectedOrder.shippingAddress.phone && <div>📞 {selectedOrder.shippingAddress.phone}</div>}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="om-detail-section">
                <h3>Items</h3>
                <div className="om-items-list">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="om-item-row">
                      {item.image && <img src={item.image} alt={item.name} className="om-item-img" />}
                      <div className="om-item-info">
                        <div className="om-item-name">{item.name}</div>
                        <div className="om-item-meta">Size: {item.size || 'N/A'} · Qty: {item.quantity}</div>
                      </div>
                      <div className="om-item-price">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="om-detail-section">
                <h3>Summary</h3>
                <div className="om-detail-row"><span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                {selectedOrder.discount > 0 && <div className="om-detail-row"><span>Discount</span><span className="om-discount">−{formatCurrency(selectedOrder.discount)}</span></div>}
                <div className="om-detail-row"><span>Shipping</span><span>{selectedOrder.shipping === 0 ? 'FREE' : formatCurrency(selectedOrder.shipping)}</span></div>
                <div className="om-detail-row om-total-row"><span>Total</span><span>{formatCurrency(selectedOrder.total)}</span></div>
              </div>

              {/* Status Update */}
              <div className="om-detail-section">
                <h3>Update Status</h3>
                <div className="om-status-buttons">
                  {statusOptions.map(s => (
                    <button
                      key={s}
                      className={`om-status-btn ${selectedOrder.status === s ? 'active' : ''} ${getStatusClass(s)}`}
                      onClick={() => handleStatusUpdate(selectedOrder._id, s)}
                      disabled={updatingStatus === selectedOrder._id}
                    >
                      <StatusIcon status={s} /> {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersManager;

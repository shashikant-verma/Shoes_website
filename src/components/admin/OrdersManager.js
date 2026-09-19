import React, { useState, useEffect } from 'react';
import './OrdersManager.css';
import orderService from '../../services/orderService';

const StatusIcon = ({ status }) => {
  const icons = {
    confirmed: '📋',
    processing: '🔄',
    shipped: '🚚',
    out_for_delivery: '📦',
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

  // Status update modal form state
  const [newStatusSelect, setNewStatusSelect] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');

  const ORDERS_PER_PAGE = 10;

  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    if (selectedOrder) {
      setNewStatusSelect(selectedOrder.status || 'confirmed');
      setTrackingNumber(selectedOrder.trackingNumber || '');
      setCarrier(selectedOrder.carrier || '');
      setEstimatedDeliveryDate(selectedOrder.estimatedDeliveryDate ? new Date(selectedOrder.estimatedDeliveryDate).toISOString().split('T')[0] : '');
      setStatusNote('');
    }
  }, [selectedOrder]);

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

  const handleStatusUpdateSubmit = async (orderId, targetStatusOverride) => {
    const targetStatus = targetStatusOverride || newStatusSelect || selectedOrder?.status;
    if (!targetStatus) return;

    setUpdatingStatus(orderId);
    try {
      const payload = {
        status: targetStatus,
        note: statusNote || `Status updated to ${targetStatus}`,
        trackingNumber,
        carrier,
        estimatedDeliveryDate: estimatedDeliveryDate || undefined
      };

      const result = await orderService.updateOrderStatus(orderId, payload);
      if (result.success && result.data?.data) {
        const updatedDoc = result.data.data;
        setOrders(prev => prev.map(o => o._id === orderId ? updatedDoc : o));
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(updatedDoc);
        }
        showToast('Order status & tracking updated!', 'success');
        setStatusNote('');
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

  const statusOptions = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

  const getStatusClass = (status) => ({
    confirmed: 'status-confirmed',
    processing: 'status-processing',
    shipped: 'status-shipped',
    out_for_delivery: 'status-out-for-delivery',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled'
  }[status] || 'status-default');

  const statsCounts = {
    all: totalOrders,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
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
          <h1 className="om-title">Orders Management</h1>
          <p className="om-subtitle">{totalOrders} total order{totalOrders !== 1 ? 's' : ''}</p>
        </div>
        <button className="om-refresh-btn" onClick={loadOrders}>
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="om-status-tabs">
        {[{ key: '', label: 'All', count: totalOrders }, ...statusOptions.map(s => ({ key: s, label: s.replace(/_/g, ' ').toUpperCase(), count: statsCounts[s] || 0 }))].map(tab => (
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
            {statusFilter ? `No ${statusFilter.replace(/_/g, ' ')} orders yet.` : 'No orders have been placed yet.'}
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
                      <span className={`om-status-badge ${getStatusClass(order.status)}`}>
                        <StatusIcon status={order.status} /> {order.status ? order.status.replace(/_/g, ' ').toUpperCase() : 'CONFIRMED'}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="om-view-btn" onClick={() => setSelectedOrder(order)}>Manage Order</button>
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

      {/* Order Detail & Tracking Management Modal */}
      {selectedOrder && (
        <div className="om-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="om-modal" onClick={e => e.stopPropagation()}>
            <div className="om-modal-header">
              <div>
                <h2>Order #{selectedOrder._id.slice(-8).toUpperCase()}</h2>
                <p>Placed on {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button className="om-modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="om-modal-body">
              {/* Customer Info */}
              <div className="om-detail-section">
                <h3>Customer Information</h3>
                <div className="om-detail-row">
                  <span>Name</span><span>{selectedOrder.user?.name || 'Guest'}</span>
                </div>
                <div className="om-detail-row">
                  <span>Email</span><span>{selectedOrder.user?.email || '—'}</span>
                </div>
              </div>

              {/* Shipping Address Snapshot */}
              {selectedOrder.shippingAddress && (
                <div className="om-detail-section">
                  <h3>Shipping Address Snapshot</h3>
                  <div className="om-address">
                    {selectedOrder.shippingAddress.street && <div>{selectedOrder.shippingAddress.street}</div>}
                    {selectedOrder.shippingAddress.city && <div>{selectedOrder.shippingAddress.city}{selectedOrder.shippingAddress.state ? `, ${selectedOrder.shippingAddress.state}` : ''} {selectedOrder.shippingAddress.pincode}</div>}
                    {selectedOrder.shippingAddress.country && <div>{selectedOrder.shippingAddress.country}</div>}
                    {selectedOrder.shippingAddress.phone && <div>📞 {selectedOrder.shippingAddress.phone}</div>}
                  </div>
                </div>
              )}

              {/* Payment Info Snapshot */}
              <div className="om-detail-section">
                <h3>Payment Verification</h3>
                <div className="om-detail-row"><span>Provider</span><span>{selectedOrder.payment?.provider || 'RAZORPAY'}</span></div>
                <div className="om-detail-row"><span>Payment Status</span><span className="om-paid-tag">{selectedOrder.payment?.status || 'PAID'}</span></div>
                {selectedOrder.payment?.razorpayPaymentId && (
                  <div className="om-detail-row"><span>Razorpay Payment ID</span><span className="om-code">{selectedOrder.payment.razorpayPaymentId}</span></div>
                )}
              </div>

              {/* Items */}
              <div className="om-detail-section">
                <h3>Purchased Footwear</h3>
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

              {/* Status Update & Tracking Management */}
              <div className="om-detail-section om-update-box">
                <h3>Update Order Status & Shipment Tracking</h3>
                <div className="om-form-group">
                  <label>Select Target Status:</label>
                  <select
                    className="om-input-select"
                    value={newStatusSelect}
                    onChange={e => setNewStatusSelect(e.target.value)}
                  >
                    {statusOptions.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="om-form-grid">
                  <div className="om-form-group">
                    <label>Carrier Partner:</label>
                    <input
                      type="text"
                      className="om-input"
                      placeholder="e.g. SoleVibe Express, BlueDart"
                      value={carrier}
                      onChange={e => setCarrier(e.target.value)}
                    />
                  </div>
                  <div className="om-form-group">
                    <label>Tracking Number:</label>
                    <input
                      type="text"
                      className="om-input"
                      placeholder="e.g. SV-TRK-98341"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="om-form-group">
                  <label>Estimated Delivery Date:</label>
                  <input
                    type="date"
                    className="om-input"
                    value={estimatedDeliveryDate}
                    onChange={e => setEstimatedDeliveryDate(e.target.value)}
                  />
                </div>

                <div className="om-form-group">
                  <label>Status Change Note:</label>
                  <textarea
                    className="om-textarea"
                    rows="2"
                    placeholder="Provide a note for customer tracking history..."
                    value={statusNote}
                    onChange={e => setStatusNote(e.target.value)}
                  ></textarea>
                </div>

                <button
                  type="button"
                  className="om-save-btn"
                  disabled={updatingStatus === selectedOrder._id}
                  onClick={() => handleStatusUpdateSubmit(selectedOrder._id)}
                >
                  {updatingStatus === selectedOrder._id ? 'Updating Order...' : 'Save Order Status & Tracking'}
                </button>
              </div>

              {/* Status History Audit Log */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="om-detail-section">
                  <h3>Status History Audit Log</h3>
                  <div className="om-history-audit">
                    {selectedOrder.statusHistory.map((h, i) => (
                      <div key={i} className="om-audit-item">
                        <span className="om-audit-status">{h.status ? h.status.toUpperCase() : 'UPDATED'}</span>
                        <div className="om-audit-info">
                          <p className="om-audit-note">{h.note || 'No note attached'}</p>
                          <span className="om-audit-meta">
                            By {h.changedBy?.name || h.changedBy?.email || 'Admin'} on {new Date(h.changedAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersManager;

import React, { useState, useEffect } from 'react';
import './ReturnsManager.css';
import returnService from '../../services/returnService';

function ReturnsManager() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReturns, setTotalReturns] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [toast, setToast] = useState(null);

  const RETURNS_PER_PAGE = 10;

  useEffect(() => {
    loadReturns();
  }, [currentPage, statusFilter]);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const filters = { page: currentPage, limit: RETURNS_PER_PAGE };
      if (statusFilter) filters.status = statusFilter;

      const result = await returnService.getAllReturns(filters);
      if (result.success) {
        setReturns(result.data.data || []);
        setTotalPages(result.data.totalPages || 1);
        setTotalReturns(result.data.total || 0);
        setError(null);
      } else {
        setError(result.message);
        setReturns([]);
      }
    } catch {
      setError('Failed to load return requests');
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedReturn) return;

    setUpdatingStatus(true);
    try {
      const payload = {
        status: newStatus,
        adminNote: adminNoteInput || `Status updated to ${newStatus}`
      };

      const result = await returnService.updateReturnStatus(selectedReturn._id, payload);
      const updatedDoc = result.data?.data || (result.data?._id ? result.data : null);
      if (result.success && updatedDoc) {
        setReturns(prev => prev.map(r => r._id === selectedReturn._id ? updatedDoc : r));
        setSelectedReturn(updatedDoc);
        showToast('Return status updated successfully!', 'success');
        setAdminNoteInput('');
      } else {
        showToast(result.message || result.data?.message || 'Failed to update return status', 'error');
      }
    } catch {
      showToast('Error updating return status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedReturn) return;

    setProcessingRefund(true);
    try {
      const result = await returnService.processRefund(selectedReturn._id);
      if (result.success && result.data?.data) {
        const updatedDoc = result.data.data;
        setReturns(prev => prev.map(r => r._id === selectedReturn._id ? updatedDoc : r));
        setSelectedReturn(updatedDoc);
        showToast('Razorpay refund processed & marked REFUNDED!', 'success');
      } else {
        showToast(result.message || 'Razorpay refund processing failed', 'error');
      }
    } catch {
      showToast('Error processing Razorpay refund', 'error');
    } finally {
      setProcessingRefund(false);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const filteredReturns = returns.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r._id?.toLowerCase().includes(q) ||
      r.order?._id?.toLowerCase().includes(q) ||
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q)
    );
  });

  const statusOptions = ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUND_PENDING', 'REFUNDED', 'CANCELLED'];

  const getStatusClass = (status) => ({
    REQUESTED: 'rm-status-requested',
    APPROVED: 'rm-status-approved',
    REJECTED: 'rm-status-rejected',
    RECEIVED: 'rm-status-received',
    REFUND_PENDING: 'rm-status-pending',
    REFUNDED: 'rm-status-refunded',
    CANCELLED: 'rm-status-cancelled'
  }[status] || 'rm-status-default');

  return (
    <div className="rm-page">
      {/* Toast */}
      {toast && (
        <div className={`rm-toast rm-toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="rm-header">
        <div>
          <h1 className="rm-title">Returns & Refunds Management</h1>
          <p className="rm-subtitle">{totalReturns} total return request{totalReturns !== 1 ? 's' : ''}</p>
        </div>
        <button className="rm-refresh-btn" onClick={loadReturns}>
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="rm-status-tabs">
        {[{ key: '', label: 'All' }, ...statusOptions.map(s => ({ key: s, label: s }))].map(tab => (
          <button
            key={tab.key}
            className={`rm-tab ${statusFilter === tab.key ? 'active' : ''}`}
            onClick={() => { setStatusFilter(tab.key); setCurrentPage(1); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rm-toolbar">
        <div className="rm-search">
          <span className="rm-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by Return ID, Order ID, customer name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="rm-search-input"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rm-loading">
          <div className="rm-spinner"></div>
          <p>Loading return requests...</p>
        </div>
      ) : error ? (
        <div className="rm-error">
          <span>⚠️</span>
          <h3>{error}</h3>
          <button onClick={loadReturns}>Try Again</button>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="rm-empty">
          <div className="rm-empty-icon">📦</div>
          <h3>No return requests found</h3>
          <p>{statusFilter ? `No ${statusFilter} return requests yet.` : 'No return requests have been submitted.'}</p>
        </div>
      ) : (
        <>
          <div className="rm-table-wrap">
            <table className="rm-table">
              <thead>
                <tr>
                  <th>Return ID</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Refund Amount</th>
                  <th>Status</th>
                  <th>Refund Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map(ret => (
                  <tr key={ret._id} className="rm-row" onClick={() => setSelectedReturn(ret)}>
                    <td><span className="rm-code">#{ret._id.slice(-8).toUpperCase()}</span></td>
                    <td><span className="rm-code">#{ret.order?._id ? ret.order._id.slice(-8).toUpperCase() : ret.order?.slice(-8).toUpperCase()}</span></td>
                    <td>
                      <div className="rm-customer-name">{ret.user?.name || 'Customer'}</div>
                      <div className="rm-customer-email">{ret.user?.email || '—'}</div>
                    </td>
                    <td>{ret.items?.length || 0} item{ret.items?.length !== 1 ? 's' : ''}</td>
                    <td><span className="rm-amount">{formatCurrency(ret.refund?.amount)}</span></td>
                    <td>
                      <span className={`rm-status-pill ${getStatusClass(ret.status)}`}>
                        {ret.status}
                      </span>
                    </td>
                    <td>
                      <span className={`rm-refund-tag ${ret.refund?.status === 'COMPLETED' ? 'completed' : ret.refund?.status === 'FAILED' ? 'failed' : 'pending'}`}>
                        {ret.refund?.status || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <button className="rm-view-btn" onClick={(e) => { e.stopPropagation(); setSelectedReturn(ret); }}>
                        Manage Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="rm-pagination">
              <button className="rm-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>← Prev</button>
              <span className="rm-page-info">Page {currentPage} of {totalPages}</span>
              <button className="rm-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Modal Detail & Management */}
      {selectedReturn && (
        <div className="rm-modal-overlay" onClick={() => setSelectedReturn(null)}>
          <div className="rm-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-modal-header">
              <div>
                <h2>Return Request #{selectedReturn._id.slice(-8).toUpperCase()}</h2>
                <p>Order #{selectedReturn.order?._id ? selectedReturn.order._id.slice(-8).toUpperCase() : 'N/A'} • Submitted on {formatDate(selectedReturn.createdAt)}</p>
              </div>
              <button className="rm-modal-close" onClick={() => setSelectedReturn(null)}>✕</button>
            </div>

            <div className="rm-modal-body">
              {/* Customer details */}
              <div className="rm-section">
                <h3>Customer Information</h3>
                <div className="rm-row-detail"><span>Customer Name</span><span>{selectedReturn.user?.name || 'Guest'}</span></div>
                <div className="rm-row-detail"><span>Email</span><span>{selectedReturn.user?.email || '—'}</span></div>
                <div className="rm-row-detail"><span>Primary Reason</span><span className="rm-highlight">{selectedReturn.reason}</span></div>
                {selectedReturn.description && (
                  <div className="rm-row-detail"><span>Description</span><span>{selectedReturn.description}</span></div>
                )}
              </div>

              {/* Items */}
              <div className="rm-section">
                <h3>Returned Items</h3>
                <div className="rm-items-list">
                  {selectedReturn.items?.map((it, idx) => (
                    <div key={idx} className="rm-item-box">
                      <div>
                        <div className="rm-item-name">{it.name}</div>
                        <div className="rm-item-meta">Reason: {it.reason} • Qty: {it.quantity}</div>
                      </div>
                      <div className="rm-item-price">{formatCurrency(it.itemAmount)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund Info */}
              <div className="rm-section">
                <h3>Calculated Refund Summary</h3>
                <div className="rm-row-detail"><span>Total Net Refund</span><span className="rm-refund-price">{formatCurrency(selectedReturn.refund?.amount)}</span></div>
                <div className="rm-row-detail"><span>Refund Status</span><span>{selectedReturn.refund?.status || 'PENDING'}</span></div>
                {selectedReturn.refund?.razorpayRefundId && (
                  <div className="rm-row-detail"><span>Razorpay Refund ID</span><span className="rm-code">{selectedReturn.refund.razorpayRefundId}</span></div>
                )}
              </div>

              {/* Update Status Form */}
              <div className="rm-section rm-update-box">
                <h3>Update Return Status</h3>
                <div className="rm-status-actions">
                  {['APPROVED', 'REJECTED', 'RECEIVED', 'REFUND_PENDING'].map(st => (
                    <button
                      key={st}
                      className={`rm-status-action-btn ${selectedReturn.status === st ? 'active' : ''}`}
                      disabled={updatingStatus}
                      onClick={() => handleStatusUpdate(st)}
                    >
                      Mark {st}
                    </button>
                  ))}
                </div>

                <div className="rm-form-group">
                  <label>Admin Note / Reason:</label>
                  <input
                    type="text"
                    className="rm-input"
                    placeholder="Enter note for return status history..."
                    value={adminNoteInput}
                    onChange={e => setAdminNoteInput(e.target.value)}
                  />
                </div>

                {/* Razorpay Refund Action */}
                {['APPROVED', 'RECEIVED', 'REFUND_PENDING'].includes(selectedReturn.status) && selectedReturn.refund?.status !== 'COMPLETED' && (
                  <div className="rm-refund-trigger-box">
                    <h4>Process Razorpay Refund</h4>
                    <p>Calculated amount to refund: <strong>{formatCurrency(selectedReturn.refund?.amount)}</strong></p>
                    <button
                      type="button"
                      className="rm-trigger-refund-btn"
                      disabled={processingRefund}
                      onClick={handleProcessRefund}
                    >
                      {processingRefund ? 'Processing Razorpay Refund...' : 'Execute Razorpay Refund Now'}
                    </button>
                  </div>
                )}
              </div>

              {/* Status History Audit Log */}
              {selectedReturn.statusHistory && selectedReturn.statusHistory.length > 0 && (
                <div className="rm-section">
                  <h3>Status History Audit Log</h3>
                  <div className="rm-history-list">
                    {selectedReturn.statusHistory.map((h, i) => (
                      <div key={i} className="rm-history-item">
                        <span className="rm-history-tag">{h.status}</span>
                        <div>
                          <div className="rm-history-note">{h.note || 'No note'}</div>
                          <div className="rm-history-meta">By {h.changedBy?.name || h.changedBy?.email || 'Admin'} on {new Date(h.changedAt).toLocaleString('en-IN')}</div>
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

export default ReturnsManager;

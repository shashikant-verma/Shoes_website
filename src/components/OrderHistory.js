import React, { useState, useEffect } from 'react';
import './OrderHistory.css';
import returnService from '../services/returnService';

const StatusIcons = {
  Processing: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  Shipped: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  ),
  Delivered: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  Cancelled: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
};

function OrderHistory({ orders = [] }) {
  const [activeModal, setActiveModal] = useState(null); // 'track' | 'details' | 'return_form' | 'return_details' | null
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [myReturns, setMyReturns] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Return Form State
  const [returnProduct, setReturnProduct] = useState('');
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState('WRONG_SIZE');
  const [returnDesc, setReturnDesc] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadMyReturns();
  }, []);

  const loadMyReturns = async () => {
    try {
      const res = await returnService.getMyReturns();
      if (res.success && res.data?.data) {
        setMyReturns(res.data.data);
      }
    } catch {
      // Ignore background load error
    }
  };

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="order-history-page">
        <div className="order-history-container">
          <div className="order-empty">
            <div className="empty-icon-wrapper">
              <span className="empty-icon">📦</span>
            </div>
            <h2 className="empty-title">No Orders Found</h2>
            <p className="empty-subtitle">Your order history will appear here once you make your first purchase.</p>
            <a href="/" className="btn-shop-now">Explore Collection</a>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status = 'confirmed') => {
    const s = status.toLowerCase();
    switch (s) {
      case 'delivered':
        return {
          label: 'Delivered',
          icon: <StatusIcons.Delivered />,
          className: 'status-delivered'
        };
      case 'out_for_delivery':
        return {
          label: 'Out For Delivery',
          icon: <StatusIcons.Shipped />,
          className: 'status-out-for-delivery'
        };
      case 'shipped':
        return {
          label: 'Shipped',
          icon: <StatusIcons.Shipped />,
          className: 'status-shipped'
        };
      case 'processing':
        return {
          label: 'Processing',
          icon: <StatusIcons.Processing />,
          className: 'status-processing'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: <StatusIcons.Cancelled />,
          className: 'status-cancelled'
        };
      case 'confirmed':
      default:
        return {
          label: 'Order Confirmed',
          icon: <StatusIcons.Processing />,
          className: 'status-confirmed'
        };
    }
  };

  const handleOpenTrack = (order) => {
    setSelectedOrder(order);
    setActiveModal('track');
  };

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setActiveModal('details');
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedOrder(null);
  };

  const getTimelineStep = (status = 'confirmed') => {
    const s = status.toLowerCase();
    if (s === 'delivered') return 5;
    if (s === 'out_for_delivery') return 4;
    if (s === 'shipped') return 3;
    if (s === 'processing') return 2;
    if (s === 'confirmed') return 1;
    return 0;
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'ALL') return true;
    return (order.status || '').toLowerCase() === statusFilter.toLowerCase();
  });

  const isReturnEligible = (order) => {
    if ((order.status || '').toLowerCase() !== 'delivered') return false;
    let deliveredTimestamp = order.updatedAt;
    if (order.statusHistory && order.statusHistory.length > 0) {
      const deliveredEntry = [...order.statusHistory].reverse().find(h => h.status === 'delivered');
      if (deliveredEntry && deliveredEntry.changedAt) {
        deliveredTimestamp = deliveredEntry.changedAt;
      }
    }
    const daysSinceDelivery = (Date.now() - new Date(deliveredTimestamp).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceDelivery <= 7;
  };

  const handleOpenReturnForm = (order) => {
    setSelectedOrder(order);
    if (order.items && order.items.length > 0) {
      setReturnProduct((order.items[0].product || order.items[0]._id || order.items[0].id).toString());
    }
    setReturnQty(1);
    setReturnReason('WRONG_SIZE');
    setReturnDesc('');
    setActiveModal('return_form');
  };

  const handleOpenReturnDetails = (ret) => {
    setSelectedReturn(ret);
    setActiveModal('return_details');
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !returnProduct) return;

    setSubmittingReturn(true);
    try {
      const payload = {
        orderId: selectedOrder._id || selectedOrder.id,
        items: [
          {
            productId: returnProduct,
            quantity: returnQty,
            reason: returnReason
          }
        ],
        description: returnDesc,
        reason: returnReason
      };

      const res = await returnService.createReturn(payload);
      if (res.success) {
        showToast('Return request submitted successfully!', 'success');
        await loadMyReturns();
        handleCloseModal();
      } else {
        showToast(res.message || 'Failed to submit return request', 'error');
      }
    } catch (err) {
      showToast('Error submitting return request', 'error');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleCancelReturn = async (returnId) => {
    try {
      const res = await returnService.cancelReturn(returnId);
      if (res.success) {
        showToast('Return request cancelled', 'success');
        await loadMyReturns();
        handleCloseModal();
      } else {
        showToast(res.message || 'Failed to cancel return', 'error');
      }
    } catch {
      showToast('Error cancelling return request', 'error');
    }
  };

  return (
    <div className="order-history-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`order-toast order-toast-${toastMessage.type}`}>
          {toastMessage.type === 'success' ? '✅' : '❌'} {toastMessage.msg}
        </div>
      )}

      <div className="order-history-container">
        {/* Page Header */}
        <div className="order-history-header">
          <div className="order-breadcrumb-tag">
            <span className="dot-indicator"></span>
            <span>ORDER HISTORY</span>
          </div>
          <h1 className="order-page-title">Your Orders ({orders.length})</h1>
          <p className="order-page-subtitle">Track, review, and manage your past footwear purchases</p>

          {/* Status Filter Tabs */}
          <div className="order-filter-tabs">
            {[
              { key: 'ALL', label: 'All Orders' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'processing', label: 'Processing' },
              { key: 'shipped', label: 'Shipped' },
              { key: 'out_for_delivery', label: 'Out for Delivery' },
              { key: 'delivered', label: 'Delivered' },
              { key: 'cancelled', label: 'Cancelled' }
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                className={`filter-tab-btn ${statusFilter === tab.key ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="order-empty-filter">
              <p>No orders match the filter "<strong>{statusFilter}</strong>".</p>
            </div>
          ) : (
            filteredOrders.map((order, index) => {
              const badge = getStatusBadge(order.status);
              const orderId = order.id || order._id || `SV-${index + 1000}`;
              const orderDate = order.date || order.createdAt ? new Date(order.date || order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'Recently Placed';

              const existingReturn = myReturns.find(r => (r.order?._id || r.order).toString() === (order._id || order.id).toString());
              const eligibleForReturn = isReturnEligible(order);

              return (
                <div key={orderId} className="order-card" style={{ animationDelay: `${index * 0.08}s` }}>
                  {/* Order Card Header */}
                  <div className="order-card-header">
                    <div className="order-id-group">
                      <span className="order-num-label">Order</span>
                      <span className="order-num-value">#{typeof orderId === 'string' ? orderId.slice(-8).toUpperCase() : orderId}</span>
                      <span className="order-date-chip">{orderDate}</span>
                    </div>
                    
                    <div className={`order-status-pill ${badge.className}`}>
                      <span className="pill-icon">{badge.icon}</span>
                      <span className="pill-text">{badge.label}</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="order-items-container">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        <div className="order-item-thumb">
                          <img 
                            src={item.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'} 
                            alt={item.name || 'Shoe Item'}
                            loading="lazy"
                          />
                        </div>
                        
                        <div className="order-item-info">
                          <h4 className="order-item-name">{item.name}</h4>
                          <div className="order-item-specs">
                            {item.size && (
                              <span className="spec-badge">Size: US {item.size}</span>
                            )}
                            <span className="spec-badge">Qty: {item.quantity || 1}</span>
                            {item.color && (
                              <span className="spec-badge">Color: {item.color}</span>
                            )}
                          </div>
                        </div>

                        <div className="order-item-price-col">
                          <span className="order-item-price">
                            ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer & Summary */}
                  <div className="order-card-footer">
                    <div className="order-financials">
                      <div className="financial-line">
                        <span className="financial-label">Subtotal</span>
                        <span className="financial-val">₹{(order.subtotal || order.total || 0).toLocaleString()}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="financial-line discount">
                          <span className="financial-label">Discount</span>
                          <span className="financial-val">-₹{order.discount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="financial-line">
                        <span className="financial-label">Shipping</span>
                        <span className="financial-val">
                          {order.shipping ? `₹${order.shipping.toLocaleString()}` : 'Free'}
                        </span>
                      </div>
                      <div className="financial-line total-line">
                        <span className="total-label">Total Amount</span>
                        <span className="total-val">₹{(order.total || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="order-button-group">
                      <button 
                        type="button" 
                        className="btn-order btn-track-order"
                        onClick={() => handleOpenTrack(order)}
                      >
                        <span>Track Order</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </button>

                      <button 
                        type="button" 
                        className="btn-order btn-order-details"
                        onClick={() => handleOpenDetails(order)}
                      >
                        View Details
                      </button>

                      {existingReturn ? (
                        <button
                          type="button"
                          className="btn-order btn-return-status"
                          onClick={() => handleOpenReturnDetails(existingReturn)}
                        >
                          Return: {existingReturn.status}
                        </button>
                      ) : eligibleForReturn ? (
                        <button
                          type="button"
                          className="btn-order btn-request-return"
                          onClick={() => handleOpenReturnForm(order)}
                        >
                          Request Return
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Tracking Modal */}
      {activeModal === 'track' && selectedOrder && (
        <div className="order-modal-backdrop" onClick={handleCloseModal}>
          <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div>
                <h3 className="modal-title">Live Order Tracking</h3>
                <p className="modal-subtitle">Order #{selectedOrder._id ? selectedOrder._id.slice(-8).toUpperCase() : selectedOrder.id}</p>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Close">
                <StatusIcons.Close />
              </button>
            </div>

            <div className="order-modal-body">
              {/* Courier info box */}
              <div className="tracking-summary-card">
                <div className="tracking-meta-col">
                  <span className="meta-sub">Courier Partner</span>
                  <span className="meta-main">{selectedOrder.carrier || 'SoleVibe Express Delivery'}</span>
                </div>
                <div className="tracking-meta-col">
                  <span className="meta-sub">Tracking ID</span>
                  <span className="meta-main tracking-code">
                    {selectedOrder.trackingNumber || `SV-TRK-${selectedOrder._id ? selectedOrder._id.slice(-6).toUpperCase() : '849201'}`}
                  </span>
                </div>
                <div className="tracking-meta-col">
                  <span className="meta-sub">Estimated Arrival</span>
                  <span className="meta-main estimated-date">
                    {selectedOrder.status === 'delivered'
                      ? 'Delivered'
                      : selectedOrder.estimatedDeliveryDate
                      ? new Date(selectedOrder.estimatedDeliveryDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '2-4 Business Days'}
                  </span>
                </div>
              </div>

              {/* Steps timeline */}
              <div className="tracking-timeline">
                {[
                  { step: 1, key: 'confirmed', title: 'Order Confirmed', desc: 'Payment verified & order created' },
                  { step: 2, key: 'processing', title: 'Processing in Hub', desc: 'Inspected, boxed & labeled for dispatch' },
                  { step: 3, key: 'shipped', title: 'Shipped', desc: 'Handed to courier partner' },
                  { step: 4, key: 'out_for_delivery', title: 'Out for Delivery', desc: 'Courier agent out for doorstep delivery' },
                  { step: 5, key: 'delivered', title: 'Delivered', desc: 'Package delivered successfully' }
                ].map((item) => {
                  const currentStep = getTimelineStep(selectedOrder.status);
                  const isCancelled = selectedOrder.status === 'cancelled';
                  const isDone = !isCancelled && currentStep >= item.step;
                  const isCurrent = !isCancelled && currentStep === item.step;

                  return (
                    <div key={item.step} className={`timeline-node ${isDone ? 'completed' : ''} ${isCurrent ? 'active' : ''} ${isCancelled ? 'cancelled-node' : ''}`}>
                      <div className="node-marker">
                        {isDone && !isCurrent ? '✓' : item.step}
                      </div>
                      <div className="node-content">
                        <h5 className="node-title">{item.title}</h5>
                        <p className="node-desc">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status History Audit Log */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="status-history-section">
                  <h4 className="preview-heading">Order Milestones & Status History</h4>
                  <div className="history-list">
                    {selectedOrder.statusHistory.map((h, hIdx) => (
                      <div key={hIdx} className="history-item">
                        <div className="history-status-tag">{h.status ? h.status.toUpperCase() : 'UPDATED'}</div>
                        <div className="history-details">
                          <p className="history-note">{h.note || 'Status modified'}</p>
                          <span className="history-time">
                            {new Date(h.changedAt).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items summary */}
              <div className="modal-items-preview">
                <h4 className="preview-heading">Items in this shipment ({(selectedOrder.items || []).length})</h4>
                <div className="preview-list">
                  {(selectedOrder.items || []).map((it, idx) => (
                    <div key={idx} className="preview-item">
                      <img src={it.image} alt={it.name} />
                      <div className="preview-text">
                        <span className="name">{it.name}</span>
                        <span className="qty">Size: {it.size || 'N/A'} • Qty: {it.quantity || 1}</span>
                      </div>
                      <span className="price">₹{((it.price || 0) * (it.quantity || 1)).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="order-modal-footer">
              <button className="btn-modal-close" onClick={handleCloseModal}>
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {activeModal === 'details' && selectedOrder && (
        <div className="order-modal-backdrop" onClick={handleCloseModal}>
          <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div>
                <h3 className="modal-title">Order Details</h3>
                <p className="modal-subtitle">Full summary and receipt for Order #{selectedOrder.id || selectedOrder._id}</p>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Close">
                <StatusIcons.Close />
              </button>
            </div>

            <div className="order-modal-body">
              {/* Info pills */}
              <div className="details-grid">
                <div className="detail-card">
                  <span className="detail-label">Status</span>
                  <span className="detail-value status-tag">{selectedOrder.status ? selectedOrder.status.toUpperCase() : 'PROCESSING'}</span>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Payment Method</span>
                  <span className="detail-value">Prepaid (Card / UPI)</span>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Order Date</span>
                  <span className="detail-value">{selectedOrder.date || 'Recent'}</span>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Total Paid</span>
                  <span className="detail-value price-highlight">₹{(selectedOrder.total || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="modal-items-preview">
                <h4 className="preview-heading">Purchased Footwear</h4>
                <div className="preview-list">
                  {(selectedOrder.items || []).map((it, idx) => (
                    <div key={idx} className="preview-item">
                      <img src={it.image} alt={it.name} />
                      <div className="preview-text">
                        <span className="name">{it.name}</span>
                        <span className="qty">Size: US {it.size || 'N/A'} • Quantity: {it.quantity || 1}</span>
                      </div>
                      <span className="price">₹{((it.price || 0) * (it.quantity || 1)).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="order-receipt-box">
                <div className="receipt-row">
                  <span>Subtotal</span>
                  <span>₹{(selectedOrder.subtotal || selectedOrder.total || 0).toLocaleString()}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="receipt-row discount">
                    <span>Promotional Discount</span>
                    <span>-₹{selectedOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="receipt-row">
                  <span>Shipping Fee</span>
                  <span>{selectedOrder.shipping ? `₹${selectedOrder.shipping.toLocaleString()}` : 'Free'}</span>
                </div>
                <div className="receipt-row receipt-total">
                  <span>Grand Total</span>
                  <span>₹{(selectedOrder.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="order-modal-footer">
              <button className="btn-modal-close" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Submission Form Modal */}
      {activeModal === 'return_form' && selectedOrder && (
        <div className="order-modal-backdrop" onClick={handleCloseModal}>
          <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div>
                <h3 className="modal-title">Request Product Return</h3>
                <p className="modal-subtitle">Order #{selectedOrder._id ? selectedOrder._id.slice(-8).toUpperCase() : selectedOrder.id}</p>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Close">
                <StatusIcons.Close />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn}>
              <div className="order-modal-body">
                <div className="return-form-group">
                  <label className="return-label">Select Item to Return:</label>
                  <select
                    className="return-select"
                    value={returnProduct}
                    onChange={(e) => setReturnProduct(e.target.value)}
                    required
                  >
                    {(selectedOrder.items || []).map((it, idx) => (
                      <option key={idx} value={(it.product || it._id || it.id).toString()}>
                        {it.name} (Max Qty: {it.quantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="return-form-group">
                  <label className="return-label">Select Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="return-input"
                    value={returnQty}
                    onChange={(e) => setReturnQty(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                  />
                </div>

                <div className="return-form-group">
                  <label className="return-label">Reason for Return:</label>
                  <select
                    className="return-select"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    required
                  >
                    <option value="WRONG_SIZE">Wrong Size / Fit Issue</option>
                    <option value="WRONG_PRODUCT">Received Wrong Item</option>
                    <option value="DAMAGED">Damaged Package / Product</option>
                    <option value="DEFECTIVE">Manufacturing Defect</option>
                    <option value="NOT_AS_DESCRIBED">Item Not As Pictured</option>
                    <option value="QUALITY_ISSUE">Unsatisfactory Quality</option>
                    <option value="CHANGED_MIND">Changed Mind</option>
                    <option value="OTHER">Other Reason</option>
                  </select>
                </div>

                <div className="return-form-group">
                  <label className="return-label">Description / Additional Notes:</label>
                  <textarea
                    className="return-textarea"
                    rows="3"
                    placeholder="Provide additional details regarding the return request..."
                    value={returnDesc}
                    onChange={(e) => setReturnDesc(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="order-modal-footer">
                <button type="button" className="btn-order-details" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-track-order" disabled={submittingReturn}>
                  {submittingReturn ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Details Modal */}
      {activeModal === 'return_details' && selectedReturn && (
        <div className="order-modal-backdrop" onClick={handleCloseModal}>
          <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div>
                <h3 className="modal-title">Return Request Details</h3>
                <p className="modal-subtitle">Request #{selectedReturn._id.slice(-8).toUpperCase()}</p>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Close">
                <StatusIcons.Close />
              </button>
            </div>

            <div className="order-modal-body">
              <div className="details-grid">
                <div className="detail-card">
                  <span className="detail-label">Return Status</span>
                  <span className="detail-value status-tag">{selectedReturn.status}</span>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Refund Status</span>
                  <span className="detail-value">{selectedReturn.refund?.status || 'PENDING'}</span>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Calculated Refund</span>
                  <span className="detail-value price-highlight">₹{(selectedReturn.refund?.amount || 0).toLocaleString()}</span>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Requested On</span>
                  <span className="detail-value">{new Date(selectedReturn.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {selectedReturn.refund?.razorpayRefundId && (
                <div className="detail-card full-width">
                  <span className="detail-label">Razorpay Refund Transaction ID</span>
                  <span className="detail-value tracking-code">{selectedReturn.refund.razorpayRefundId}</span>
                </div>
              )}

              {/* Items List */}
              <div className="modal-items-preview">
                <h4 className="preview-heading">Returned Items</h4>
                <div className="preview-list">
                  {(selectedReturn.items || []).map((it, idx) => (
                    <div key={idx} className="preview-item">
                      <div className="preview-text">
                        <span className="name">{it.name}</span>
                        <span className="qty">Reason: {it.reason} • Qty: {it.quantity}</span>
                      </div>
                      <span className="price">₹{(it.itemAmount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Note if present */}
              {selectedReturn.adminNote && (
                <div className="receipt-row">
                  <span className="meta-sub">Admin Note:</span>
                  <span className="meta-main">{selectedReturn.adminNote}</span>
                </div>
              )}

              {/* Status History Audit Log */}
              {selectedReturn.statusHistory && selectedReturn.statusHistory.length > 0 && (
                <div className="status-history-section">
                  <h4 className="preview-heading">Return Status History</h4>
                  <div className="history-list">
                    {selectedReturn.statusHistory.map((h, hIdx) => (
                      <div key={hIdx} className="history-item">
                        <div className="history-status-tag">{h.status}</div>
                        <div className="history-details">
                          <p className="history-note">{h.note || 'Status updated'}</p>
                          <span className="history-time">
                            {new Date(h.changedAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="order-modal-footer">
              {selectedReturn.status === 'REQUESTED' && (
                <button
                  type="button"
                  className="btn-order-details danger"
                  onClick={() => handleCancelReturn(selectedReturn._id)}
                >
                  Cancel Return Request
                </button>
              )}
              <button className="btn-modal-close" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderHistory;


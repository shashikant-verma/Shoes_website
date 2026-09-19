import React, { useState } from 'react';
import './OrderHistory.css';

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

function OrderHistory({ orders }) {
  const [activeModal, setActiveModal] = useState(null); // 'track' | 'details' | null
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const getStatusBadge = (status = 'processing') => {
    const s = status.toLowerCase();
    switch (s) {
      case 'delivered':
        return {
          label: 'Delivered',
          icon: <StatusIcons.Delivered />,
          className: 'status-delivered'
        };
      case 'shipped':
        return {
          label: 'Shipped',
          icon: <StatusIcons.Shipped />,
          className: 'status-shipped'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: <StatusIcons.Cancelled />,
          className: 'status-cancelled'
        };
      case 'processing':
      default:
        return {
          label: 'Processing',
          icon: <StatusIcons.Processing />,
          className: 'status-processing'
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

  const getTimelineStep = (status = 'processing') => {
    const s = status.toLowerCase();
    if (s === 'delivered') return 4;
    if (s === 'shipped') return 3;
    if (s === 'processing') return 2;
    return 1;
  };

  return (
    <div className="order-history-page">
      <div className="order-history-container">
        {/* Page Header */}
        <div className="order-history-header">
          <div className="order-breadcrumb-tag">
            <span className="dot-indicator"></span>
            <span>ORDER HISTORY</span>
          </div>
          <h1 className="order-page-title">Your Orders ({orders.length})</h1>
          <p className="order-page-subtitle">Track, review, and manage your past footwear purchases</p>
        </div>

        {/* Orders List */}
        <div className="orders-list">
          {orders.map((order, index) => {
            const badge = getStatusBadge(order.status);
            const orderId = order.id || order._id || `SV-${index + 1000}`;
            const orderDate = order.date || order.createdAt ? new Date(order.date || order.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }) : 'Recently Placed';

            return (
              <div key={orderId} className="order-card" style={{ animationDelay: `${index * 0.08}s` }}>
                {/* Order Card Header */}
                <div className="order-card-header">
                  <div className="order-id-group">
                    <span className="order-num-label">Order</span>
                    <span className="order-num-value">#{orderId}</span>
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tracking Modal */}
      {activeModal === 'track' && selectedOrder && (
        <div className="order-modal-backdrop" onClick={handleCloseModal}>
          <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div>
                <h3 className="modal-title">Live Order Tracking</h3>
                <p className="modal-subtitle">Order #{selectedOrder.id || selectedOrder._id}</p>
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
                  <span className="meta-main">SoleVibe Express Delivery</span>
                </div>
                <div className="tracking-meta-col">
                  <span className="meta-sub">Tracking ID</span>
                  <span className="meta-main tracking-code">SV-TRK-{selectedOrder.id ? String(selectedOrder.id).slice(-6).toUpperCase() : '849201'}</span>
                </div>
                <div className="tracking-meta-col">
                  <span className="meta-sub">Estimated Arrival</span>
                  <span className="meta-main estimated-date">
                    {selectedOrder.status === 'delivered' ? 'Delivered' : '2-4 Business Days'}
                  </span>
                </div>
              </div>

              {/* Steps timeline */}
              <div className="tracking-timeline">
                {[
                  { step: 1, title: 'Order Confirmed', desc: 'Payment verified & order created' },
                  { step: 2, title: 'Processing in Hub', desc: 'Inspected, boxed & labeled for dispatch' },
                  { step: 3, title: 'In Transit', desc: 'Handed to courier, on the way to your city' },
                  { step: 4, title: 'Delivered', desc: 'Package delivered to your doorstep' }
                ].map((item) => {
                  const currentStep = getTimelineStep(selectedOrder.status);
                  const isDone = currentStep >= item.step;
                  const isCurrent = currentStep === item.step;

                  return (
                    <div key={item.step} className={`timeline-node ${isDone ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}>
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
    </div>
  );
}

export default OrderHistory;

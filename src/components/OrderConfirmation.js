import React from 'react';
import './OrderConfirmation.css';

function OrderConfirmation({ order, onContinueShopping, onViewOrders }) {
  if (!order) {
    return (
      <div className="order-confirmation-page">
        <div className="order-confirmation-container">
          <div className="confirmation-error">
            <div className="error-icon">👟</div>
            <h2>Order Not Found</h2>
            <p>We couldn't find your order details. Please check your account order history.</p>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={onContinueShopping}
            >
              Back to SoleVibe
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deliveryDateDisplay = order.estimatedDeliveryDate 
    ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

  const orderNum = order.orderNumber || order._id || order.id;
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="order-confirmation-page">
      <div className="order-confirmation-container">
        {/* Success Header */}
        <div className="confirmation-header">
          <div className="success-animation">
            <div className="checkmark-circle">
              <div className="checkmark">✓</div>
            </div>
          </div>
          <span className="confirmation-eyebrow">ORDER CONFIRMED & DISPATCH PREPARED</span>
          <h1 className="headline-xl">Thank You for Choosing SoleVibe</h1>
          <p className="body-lg">
            Your footwear order has been verified and registered. You will receive real-time updates as your pair moves through our fulfillment center.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="order-details-card">
          <div className="order-details-header">
            <div className="telemetry-badge">
              <span className="status-dot pulse-glow"></span>
              <span className="telemetry-label">VERIFIED TRANSACTION</span>
            </div>
            <div className="order-meta">
              <h2 className="headline-lg">Order #{orderNum}</h2>
              <p className="order-date-text">Placed on {formatDate(order.createdAt || new Date())}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="confirmed-items">
            <h3 className="section-title">FOOTWEAR ITEMS ({items.reduce((s, i) => s + (i.quantity || 1), 0)})</h3>
            <div className="items-list">
              {items.map((item, index) => (
                <div key={index} className="confirmed-item">
                  <div className="item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <h4 className="item-name">{item.name}</h4>
                    <div className="item-meta">
                      <span className="meta-pill">SIZE: UK {item.size}</span>
                      <span className="meta-pill">QTY: {item.quantity}</span>
                    </div>
                    <div className="item-price">
                      <span className="price-val">₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Address Snapshot */}
          {order.shippingAddress && (
            <div className="address-snapshot-section">
              <h3 className="section-title">DISPATCH DESTINATION</h3>
              <div className="address-snapshot-card">
                <div className="address-snapshot-header">
                  <strong>{order.shippingAddress.fullName}</strong>
                  <span className="type-badge">{order.shippingAddress.type || 'HOME'}</span>
                </div>
                <p className="address-snapshot-text">
                  {order.shippingAddress.street || order.shippingAddress.addressLine1}
                  {order.shippingAddress.landmark ? `, Near ${order.shippingAddress.landmark}` : ''}
                </p>
                <p className="address-snapshot-city">
                  {order.shippingAddress.city}, {order.shippingAddress.state} - <strong>{order.shippingAddress.pincode || order.shippingAddress.postalCode}</strong>
                </p>
                <p className="address-snapshot-contact">📞 +91 {order.shippingAddress.phone}</p>
              </div>
            </div>
          )}

          {/* Shipping & Delivery Timeline */}
          <div className="shipping-info-section">
            <h3 className="section-title">DELIVERY STATUS & ESTIMATE</h3>
            <div className="delivery-details">
              <div className="estimated-delivery-box">
                <div className="delivery-icon-wrap">🚚</div>
                <div className="delivery-text-wrap">
                  <span className="est-label">Estimated Delivery Date</span>
                  <span className="est-date">{deliveryDateDisplay}</span>
                  <span className="est-method">
                    Carrier: {order.shippingMethodName || (order.shippingMethod === 'express' ? 'Express Courier' : 'Standard Delivery')} ({order.estimatedDeliveryRange || '3-5 business days'})
                  </span>
                </div>
              </div>

              <div className="delivery-timeline">
                <div className="timeline-item active">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>Order Confirmed</h4>
                    <p>{formatDate(order.createdAt || new Date())}</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>Fulfillment & Quality Check</h4>
                    <p>1 business day</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>In Transit</h4>
                    <p>Tracking number will be assigned</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>Delivered</h4>
                    <p>{deliveryDateDisplay}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary & Financials */}
          <div className="order-summary-section">
            <h3 className="section-title">FINANCIAL SUMMARY</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span className="summary-label">Items Subtotal:</span>
                <span className="summary-val">₹{(order.subtotal || 0).toLocaleString()}</span>
              </div>
              
              {order.discount > 0 && (
                <div className="summary-row discount-row">
                  <span className="summary-label">Coupon Discount {order.promoCode && `(${order.promoCode})`}:</span>
                  <span className="summary-val discount-val">-₹{order.discount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="summary-row">
                <span className="summary-label">Shipping & Handling:</span>
                <span className="summary-val">{order.shipping === 0 ? 'FREE' : `₹${(order.shipping || 0).toLocaleString()}`}</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row summary-total">
                <span className="total-label">Total Amount Paid:</span>
                <span className="total-val">₹{(order.total || 0).toLocaleString()}</span>
              </div>
              <span className="tax-inclusive-tag">All taxes included (18% GST)</span>
            </div>
          </div>

          {/* Next Steps / Guarantees */}
          <div className="next-steps-section">
            <h3 className="section-title">THE SOLEVIBE COMMITMENT</h3>
            <div className="next-steps-grid">
              <div className="step-card">
                <div className="step-icon">📧</div>
                <h4>Instant Confirmation</h4>
                <p>Order receipt and itemized invoice dispatched to your email address.</p>
              </div>
              <div className="step-card">
                <div className="step-icon">↩️</div>
                <h4>7-Day Return Policy</h4>
                <p>Hassle-free 7-day returns on unworn shoes in original packaging.</p>
              </div>
              <div className="step-card">
                <div className="step-icon">⚡</div>
                <h4>Athlete Support</h4>
                <p>SoleVibe specialists are available for sizing, fit, and order queries.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="confirmation-actions">
          <button 
            type="button"
            className="btn-primary btn-view-orders"
            onClick={onViewOrders}
          >
            <span>VIEW IN ORDER HISTORY</span>
            <span className="btn-icon">📦</span>
          </button>
          <button 
            type="button"
            className="btn-secondary btn-continue-shop"
            onClick={onContinueShopping}
          >
            <span>CONTINUE SHOPPING</span>
            <span className="btn-icon">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;

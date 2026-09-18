import React from 'react';
import './OrderConfirmation.css';

function OrderConfirmation({ order, onContinueShopping, onViewOrders }) {
  if (!order) {
    return (
      <div className="order-confirmation-page">
        <div className="order-confirmation-container">
          <div className="confirmation-error">
            <div className="error-icon">❌</div>
            <h2>Order Not Found</h2>
            <p>We couldn't find your order details.</p>
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
          <h1 className="headline-xl">Order Placed Successfully!</h1>
          <p className="body-lg">Thank you for choosing SoleVibe. Your order is being processed.</p>
        </div>

        {/* Order Details Card */}
        <div className="order-details-card">
          <div className="order-details-header">
            <div className="telemetry-badge">
              <span className="status-dot pulse-glow"></span>
              <span className="telemetry-label">ORDER CONFIRMATION</span>
            </div>
            <div className="order-meta">
              <h2 className="headline-lg">Order #{order.id}</h2>
              <p className="body-md">Placed on {formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="confirmed-items">
            <h3 className="headline-md">Items Ordered ({order.items.length})</h3>
            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={index} className="confirmed-item">
                  <div className="item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <h4 className="body-lg">{item.name}</h4>
                    <div className="item-meta">
                      <span className="telemetry-label">SIZE: US {item.size}</span>
                      <span className="telemetry-label">QTY: {item.quantity}</span>
                    </div>
                    <div className="item-price">
                      <span className="telemetry-metric">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary-section">
            <h3 className="headline-md">Order Summary</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span className="body-md">Subtotal ({order.items.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
                <span className="body-md">₹{order.subtotal.toLocaleString()}</span>
              </div>
              
              {order.discount > 0 && (
                <div className="summary-row discount-row">
                  <span className="body-md">Discount {order.promoCode && `(${order.promoCode})`}:</span>
                  <span className="body-md discount-amount">-₹{order.discount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="summary-row">
                <span className="body-md">Shipping & Handling:</span>
                <span className="body-md">{order.shipping === 0 ? 'FREE' : `₹${order.shipping.toLocaleString()}`}</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row summary-total">
                <span className="headline-md">Total Paid:</span>
                <span className="total-amount">₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="shipping-info-section">
            <h3 className="headline-md">Delivery Information</h3>
            <div className="delivery-details">
              <div className="delivery-timeline">
                <div className="timeline-item active">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4 className="body-lg">Order Confirmed</h4>
                    <p className="telemetry-label">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4 className="body-lg">Processing</h4>
                    <p className="telemetry-label">1-2 business days</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4 className="body-lg">Shipped</h4>
                    <p className="telemetry-label">3-5 business days</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4 className="body-lg">Delivered</h4>
                    <p className="telemetry-label">5-7 business days</p>
                  </div>
                </div>
              </div>
              
              <div className="estimated-delivery">
                <div className="delivery-badge">
                  <span className="delivery-icon">🚚</span>
                  <div className="delivery-text">
                    <p className="body-lg">Estimated Delivery</p>
                    <p className="telemetry-metric">
                      {new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="next-steps-section">
            <h3 className="headline-md">What's Next?</h3>
            <div className="next-steps-grid">
              <div className="step-card">
                <div className="step-icon">📧</div>
                <h4 className="body-lg">Order Confirmation Email</h4>
                <p className="body-sm">Check your inbox for order details and tracking information.</p>
              </div>
              <div className="step-card">
                <div className="step-icon">📦</div>
                <h4 className="body-lg">Order Processing</h4>
                <p className="body-sm">We'll prepare your items and send shipping updates.</p>
              </div>
              <div className="step-card">
                <div className="step-icon">🚚</div>
                <h4 className="body-lg">Track Your Order</h4>
                <p className="body-sm">Monitor your order status and delivery progress.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="confirmation-actions">
          <button 
            className="btn btn-primary btn-lg"
            onClick={onViewOrders}
          >
            <span className="telemetry-label">VIEW ORDER HISTORY</span>
          </button>
          <button 
            className="btn btn-secondary btn-lg"
            onClick={onContinueShopping}
          >
            <span className="telemetry-label">CONTINUE SHOPPING</span>
          </button>
        </div>

        {/* Support Section */}
        <div className="support-section">
          <h3 className="headline-md">Need Help?</h3>
          <p className="body-md">
            Have questions about your order? Contact our customer support team.
          </p>
          <div className="support-actions">
            <button className="btn btn-outline">
              <span className="telemetry-label">CONTACT SUPPORT</span>
            </button>
            <button className="btn btn-outline">
              <span className="telemetry-label">ORDER HELP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;
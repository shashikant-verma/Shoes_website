import React from 'react';
import './OrderHistory.css';

function OrderHistory({ orders }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="order-history-page">
        <div className="order-history-container">
          <div className="order-empty">
            <div className="empty-icon">📦</div>
            <h2 className="headline-lg">No Orders Yet</h2>
            <p className="body-lg">Your order history will appear here once you make a purchase</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'tertiary';
      case 'shipped':
        return 'secondary';
      case 'processing':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'primary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return '✓';
      case 'shipped':
        return '🚚';
      case 'processing':
        return '⏳';
      case 'cancelled':
        return '✕';
      default:
        return '📦';
    }
  };

  return (
    <div className="order-history-page">
      <div className="order-history-container">
        <div className="order-history-header">
          <div className="telemetry-badge">
            <span className="status-dot pulse-glow"></span>
            <span className="telemetry-label">ORDER HISTORY</span>
          </div>
          <h1 className="headline-lg">Your Orders ({orders.length})</h1>
          <p className="body-md">Track and review your past purchases</p>
        </div>

        <div className="orders-list">
          {orders.map((order, index) => (
            <div
              key={order.id}
              className="order-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="order-header">
                <div className="order-info-left">
                  <h3 className="headline-md">Order #{order.id}</h3>
                  <span className="telemetry-label order-date">{order.date}</span>
                </div>
                <div className={`order-status status-${getStatusColor(order.status)}`}>
                  <span className="status-icon">{getStatusIcon(order.status)}</span>
                  <span className="telemetry-label">{order.status.toUpperCase()}</span>
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <div className="order-item-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="order-item-details">
                      <h4 className="body-md">{item.name}</h4>
                      <div className="order-item-meta">
                        <span className="telemetry-label">SIZE: US {item.size}</span>
                        <span className="telemetry-label">QTY: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="order-item-price">
                      <span className="telemetry-metric">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-summary">
                  <div className="summary-row">
                    <span className="body-sm">Subtotal:</span>
                    <span className="body-sm">₹{order.subtotal.toLocaleString()}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="summary-row discount-row">
                      <span className="body-sm">Discount:</span>
                      <span className="body-sm">-₹{order.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span className="body-sm">Shipping:</span>
                    <span className="body-sm">₹{order.shipping.toLocaleString()}</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-row summary-total">
                    <span className="headline-sm">Total:</span>
                    <span className="order-total">₹{order.total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="order-actions">
                  <button className="btn-order-action btn-track">
                    <span className="telemetry-label">TRACK ORDER</span>
                  </button>
                  <button className="btn-order-action btn-details">
                    <span className="telemetry-label">VIEW DETAILS</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrderHistory;

import React, { useState } from 'react';
import './Cart.css';

function Cart({ cart, onUpdateCart, onRemoveItem, currentUser, showToast, onOrderComplete }) {
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const promoCodes = {
    'KINETIC10': 10,
    'RUNNER15': 15,
    'SPEED20': 20
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 15000 ? 0 : 150;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount + shipping;

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    onUpdateCart(itemId, newQuantity);
  };

  const handleApplyPromo = () => {
    const code = promoCode.toUpperCase();
    if (promoCodes[code]) {
      setDiscount(promoCodes[code]);
      setPromoApplied(true);
      if (showToast) {
        showToast(`Promo code applied! ${promoCodes[code]}% discount`, 'success');
      }
    } else {
      if (showToast) {
        showToast('Invalid promo code', 'error');
      }
    }
  };

  const generateOrderId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SV${timestamp}${random}`;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      if (showToast) {
        showToast('Your cart is empty!', 'warning');
      }
      return;
    }
    
    setIsCheckingOut(true);
    
    try {
      // Import dynamically or ensure it's imported at top. We will import at top.
      const orderData = {
        items: cart.map(item => ({
          product: item.id || item._id,
          name: item.name,
          image: item.image,
          // FIX 7: price intentionally omitted — backend recalculates from MongoDB
          quantity: item.quantity,
          size: item.size,
          category: item.category
        })),
        promoCode: promoApplied ? promoCode.toUpperCase() : null,
        shippingAddress: {
          street: "Default Street",
          city: "Default City",
          state: "Default State",
          pincode: "000000",
          country: "Default Country",
          phone: "0000000000"
        },
        notes: ""
      };

      // Call backend API
      const result = await require('../services/orderService').default.createOrder(orderData);

      if (result.success) {
        // Axios gives us result.data which is the server's JSON response: { success, message, data: orderObject }
        // So the actual order is result.data.data
        const createdOrder = result.data.data;
        
        if (showToast) {
          showToast(`🎉 Order placed successfully! Order #${createdOrder._id || generateOrderId()}`, 'success');
        }
        
        // Call the order completion handler
        if (onOrderComplete) {
          onOrderComplete(createdOrder);
        }
      } else {
        if (showToast) {
          showToast(result.message || 'Failed to place order', 'error');
        }
      }
    } catch (error) {
      if (showToast) {
        showToast('An error occurred during checkout', 'error');
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-empty">
            <div className="empty-icon">🛒</div>
            <h2 className="headline-lg">Your Cart is Empty</h2>
            <p className="body-lg">Add some amazing shoes to get started!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <div className="telemetry-badge">
            <span className="status-dot pulse-glow"></span>
            <span className="telemetry-label">SHOPPING CART</span>
          </div>
          <h1 className="headline-lg">Your Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</h1>
        </div>

        <div className="cart-layout">
          {/* Left - Cart Items */}
          <div className="cart-items">
            {cart.map((item) => (
              <div key={`${item.id}-${item.size}`} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </div>

                <div className="cart-item-details">
                  <div className="cart-item-header">
                    <h3 className="headline-md">{item.name}</h3>
                    <button 
                      className="btn-remove"
                      onClick={() => onRemoveItem(item.id, item.size)}
                      title="Remove from cart"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="cart-item-meta">
                    <span className="telemetry-label">SIZE: US {item.size}</span>
                    <span className="telemetry-label">
                      {item.category === 'men' ? '👨 MEN\'S' : '👩 WOMEN\'S'}
                    </span>
                  </div>

                  <div className="cart-item-specs">
                    <div className="spec-badge">
                      <span className="telemetry-label">WEIGHT</span>
                      <span className="body-sm">{item.specifications?.weight || item.specs?.weight || '290g'}</span>
                    </div>
                    <div className="spec-badge">
                      <span className="telemetry-label">ENERGY</span>
                      <span className="body-sm">{item.specifications?.energy || item.specs?.energy || '85%'}</span>
                    </div>
                  </div>

                  <div className="cart-item-footer">
                    <div className="cart-quantity">
                      <button 
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        +
                      </button>
                    </div>

                    <div className="cart-item-price">
                      <span className="telemetry-label">PRICE</span>
                      <span className="price-value">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right - Order Summary */}
          <div className="cart-summary">
            <div className="summary-card">
              <h2 className="headline-md">Order Summary</h2>

              {/* Promo Code */}
              <div className="promo-section">
                <label className="telemetry-label">PROMO CODE</label>
                <div className="promo-input-group">
                  <input
                    type="text"
                    className="promo-input"
                    placeholder="Enter code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={promoApplied}
                  />
                  <button 
                    className="btn-apply-promo"
                    onClick={handleApplyPromo}
                    disabled={promoApplied || !promoCode}
                  >
                    {promoApplied ? '✓ APPLIED' : 'APPLY'}
                  </button>
                </div>
                {promoApplied && (
                  <p className="promo-success">✅ {discount}% discount applied!</p>
                )}
                <p className="promo-hint telemetry-label">
                  Try: KINETIC10, RUNNER15, SPEED20
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="summary-breakdown">
                <div className="summary-row">
                  <span className="body-md">Subtotal</span>
                  <span className="body-md">₹{subtotal.toLocaleString()}</span>
                </div>

                {discount > 0 && (
                  <div className="summary-row discount-row">
                    <span className="body-md">Discount ({discount}%)</span>
                    <span className="body-md">-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="summary-row">
                  <span className="body-md">Shipping</span>
                  <span className="body-md">
                    {shipping === 0 ? (
                      <span className="free-shipping">FREE ✓</span>
                    ) : (
                      `₹${shipping.toLocaleString()}`
                    )}
                  </span>
                </div>

                {shipping > 0 && (
                  <p className="shipping-notice telemetry-label">
                    Add ₹{(15000 - subtotal).toLocaleString()} more for FREE shipping
                  </p>
                )}

                <div className="summary-divider"></div>

                <div className="summary-row summary-total">
                  <span className="headline-md">Total</span>
                  <span className="total-price">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button 
                className={`btn-checkout ${isCheckingOut ? 'loading' : ''}`}
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (
                  <>
                    <span>PROCESSING...</span>
                    <span className="btn-icon">⏳</span>
                  </>
                ) : (
                  <>
                    <span>PROCEED TO CHECKOUT</span>
                    <span className="btn-icon">→</span>
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="trust-badges">
                <div className="trust-item">
                  <span className="trust-icon">🔒</span>
                  <span className="telemetry-label">SECURE PAYMENT</span>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">↩️</span>
                  <span className="telemetry-label">30-DAY RETURNS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;

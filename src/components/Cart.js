import React, { useState } from 'react';
import './Cart.css';

function Cart({ cart, onUpdateCart, onRemoveItem, currentUser }) {
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  const promoCodes = {
    'KINETIC10': 10,
    'RUNNER15': 15,
    'SPEED20': 20
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 180 ? 0 : 15;
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
      alert(`✅ Promo code applied! ${promoCodes[code]}% discount`);
    } else {
      alert('❌ Invalid promo code');
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    alert(`🎉 Checkout complete!\n\nTotal: $${total.toFixed(2)}\n\nThank you for your order, ${currentUser.name}!`);
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
                      <span className="body-sm">{item.specs.weight}</span>
                    </div>
                    <div className="spec-badge">
                      <span className="telemetry-label">ENERGY</span>
                      <span className="body-sm">{item.specs.energy}</span>
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
                      <span className="price-value">${(item.price * item.quantity).toFixed(2)}</span>
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
                  <span className="body-md">${subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="summary-row discount-row">
                    <span className="body-md">Discount ({discount}%)</span>
                    <span className="body-md">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="summary-row">
                  <span className="body-md">Shipping</span>
                  <span className="body-md">
                    {shipping === 0 ? (
                      <span className="free-shipping">FREE ✓</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>

                {shipping > 0 && (
                  <p className="shipping-notice telemetry-label">
                    Add ${(180 - subtotal).toFixed(2)} more for FREE shipping
                  </p>
                )}

                <div className="summary-divider"></div>

                <div className="summary-row summary-total">
                  <span className="headline-md">Total</span>
                  <span className="total-price">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button className="btn-checkout" onClick={handleCheckout}>
                <span>PROCEED TO CHECKOUT</span>
                <span className="btn-icon">→</span>
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

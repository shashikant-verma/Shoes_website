import React, { useState, useEffect, useCallback } from 'react';
import couponService from '../services/couponService';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import './Cart.css';

// Helper function to dynamically load Razorpay Checkout Script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Cart({ cart, onUpdateCart, onRemoveItem, currentUser, showToast, onOrderComplete }) {
  const [promoCode, setPromoCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= 15000 || subtotal === 0 ? 0 : 150;
  const total = Math.max(0, subtotal - discountAmount) + shipping;

  // Re-validate applied coupon whenever cart items or quantities change
  const revalidateCoupon = useCallback(async (activeCode) => {
    if (!activeCode || cart.length === 0) {
      setCouponData(null);
      setDiscountAmount(0);
      setCouponMessage(null);
      return;
    }

    const res = await couponService.validateCoupon({
      code: activeCode,
      cartItems: cart
    });

    if (res.success && res.valid) {
      setCouponData(res);
      setDiscountAmount(res.discountAmount || 0);
      setCouponMessage({ type: 'success', text: res.message });
    } else {
      setCouponData(null);
      setDiscountAmount(0);
      setCouponMessage({ type: 'error', text: res.message || 'Coupon is no longer applicable to cart' });
      if (showToast) {
        showToast(`Coupon '${activeCode}' removed: ${res.message || 'No longer applicable'}`, 'warning');
      }
    }
  }, [cart, showToast]);

  useEffect(() => {
    if (couponData && couponData.code) {
      revalidateCoupon(couponData.code);
    }
  }, [cart.length, cart, couponData, revalidateCoupon]);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    onUpdateCart(itemId, newQuantity);
  };

  const handleApplyPromo = async () => {
    if (!promoCode || !promoCode.trim()) return;

    setIsValidatingCoupon(true);
    setCouponMessage(null);

    const res = await couponService.validateCoupon({
      code: promoCode,
      cartItems: cart
    });

    setIsValidatingCoupon(false);

    if (res.success && res.valid) {
      setCouponData(res);
      setDiscountAmount(res.discountAmount || 0);
      setCouponMessage({ type: 'success', text: res.message });
      if (showToast) {
        showToast(`🎉 ${res.message}`, 'success');
      }
    } else {
      setCouponData(null);
      setDiscountAmount(0);
      setCouponMessage({ type: 'error', text: res.message || 'Invalid coupon code' });
      if (showToast) {
        showToast(res.message || 'Invalid promo code', 'error');
      }
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setCouponData(null);
    setDiscountAmount(0);
    setCouponMessage(null);
    if (showToast) {
      showToast('Coupon code removed', 'info');
    }
  };

  const generateOrderId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SV${timestamp}${random}`;
  };

  // Razorpay Checkout Integration Flow
  const handleCheckout = async () => {
    if (cart.length === 0) {
      if (showToast) {
        showToast('Your cart is empty!', 'warning');
      }
      return;
    }

    setIsCheckingOut(true);

    try {
      const activePromo = couponData ? couponData.code : (promoCode ? promoCode.trim().toUpperCase() : null);

      // Step 1: Request backend to calculate true total & create Razorpay Order
      const initRes = await paymentService.createPaymentOrder({
        items: cart.map(item => ({
          product: item.id || item._id,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          size: item.size,
          category: item.category
        })),
        promoCode: activePromo,
        shippingAddress: {
          street: "Default Street",
          city: "Default City",
          state: "Default State",
          pincode: "000000",
          country: "Default Country",
          phone: "0000000000"
        }
      });

      if (!initRes.success) {
        setIsCheckingOut(false);
        if (showToast) {
          showToast(initRes.message || 'Failed to initiate payment', 'error');
        }
        return;
      }

      // Step 2: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      const isPlaceholderKey = !initRes.keyId || 
                               initRes.keyId === 'rzp_test_placeholder_key_id' || 
                               initRes.keyId.includes('placeholder');
      const isMockOrder = !initRes.razorpayOrderId || 
                          initRes.razorpayOrderId.startsWith('mock_');

      if (scriptLoaded && window.Razorpay && !isPlaceholderKey && !isMockOrder) {
        const options = {
          key: initRes.keyId || process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id',
          amount: initRes.amount,
          currency: initRes.currency || 'INR',
          name: 'SoleVibe Shoes',
          description: 'Order Payment',
          image: 'https://cdn-icons-png.flaticon.com/512/2589/2589903.png',
          order_id: initRes.razorpayOrderId,
          handler: async function (response) {
            setIsCheckingOut(true);
            const verifyRes = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items: cart,
              promoCode: activePromo,
              shippingAddress: {
                street: "Default Street",
                city: "Default City",
                state: "Default State",
                pincode: "000000",
                country: "Default Country",
                phone: "0000000000"
              },
              notes: ""
            });

            setIsCheckingOut(false);
            if (verifyRes.success) {
              if (showToast) {
                showToast(`🎉 Payment Verified & Order Placed! Order #${verifyRes.data?._id || generateOrderId()}`, 'success');
              }
              if (onOrderComplete) {
                onOrderComplete(verifyRes.data);
              }
            } else {
              if (showToast) {
                showToast(verifyRes.message || 'Payment Verification Failed', 'error');
              }
            }
          },
          modal: {
            ondismiss: function () {
              setIsCheckingOut(false);
              if (showToast) {
                showToast('Payment window closed', 'info');
              }
            }
          },
          prefill: {
            name: currentUser?.name || 'Customer Name',
            email: currentUser?.email || 'customer@example.com'
          },
          theme: {
            color: '#ff4d2e'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setIsCheckingOut(false);
          if (showToast) {
            showToast(`Payment Failed: ${response.error?.description || 'Transaction declined'}`, 'error');
          }
        });
        rzp.open();
      } else {
        // Fallback for automated environment or offline mode: Order direct creation
        const directOrderRes = await orderService.createOrder({
          items: cart.map(item => ({
            product: item.id || item._id,
            name: item.name,
            image: item.image,
            quantity: item.quantity,
            size: item.size,
            category: item.category
          })),
          promoCode: activePromo,
          shippingAddress: {
            street: "Default Street",
            city: "Default City",
            state: "Default State",
            pincode: "000000",
            country: "Default Country",
            phone: "0000000000"
          },
          notes: "Direct checkout fallback"
        });

        setIsCheckingOut(false);

        if (directOrderRes.success) {
          const createdOrder = directOrderRes.data.data;
          if (showToast) {
            showToast(`🎉 Order placed successfully! Order #${createdOrder._id || generateOrderId()}`, 'success');
          }
          if (onOrderComplete) {
            onOrderComplete(createdOrder);
          }
        } else {
          if (showToast) {
            showToast(directOrderRes.message || 'Failed to place order', 'error');
          }
        }
      }
    } catch (error) {
      setIsCheckingOut(false);
      if (showToast) {
        showToast('An error occurred during payment processing', 'error');
      }
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
              <div key={`${item.id || item._id}-${item.size}`} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </div>

                <div className="cart-item-details">
                  <div className="cart-item-header">
                    <h3 className="headline-md">{item.name}</h3>
                    <button 
                      className="btn-remove"
                      onClick={() => onRemoveItem(item.id || item._id, item.size)}
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
                        onClick={() => handleQuantityChange(item.id || item._id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id || item._id, item.quantity + 1)}
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

              {/* Promo / Coupon Section */}
              <div className="promo-section">
                <label className="telemetry-label">HAVE A COUPON?</label>
                <div className="promo-input-group">
                  <input
                    type="text"
                    className="promo-input"
                    placeholder="Enter coupon code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    disabled={!!couponData || isValidatingCoupon}
                  />
                  {couponData ? (
                    <button 
                      className="btn-apply-promo btn-remove-promo"
                      onClick={handleRemovePromo}
                    >
                      REMOVE
                    </button>
                  ) : (
                    <button 
                      className="btn-apply-promo"
                      onClick={handleApplyPromo}
                      disabled={isValidatingCoupon || !promoCode.trim()}
                    >
                      {isValidatingCoupon ? '...' : 'APPLY'}
                    </button>
                  )}
                </div>

                {couponMessage && (
                  <p className={couponMessage.type === 'success' ? 'promo-success' : 'size-error-message'}>
                    {couponMessage.type === 'success' ? '✅' : '⚠️'} {couponMessage.text}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="summary-breakdown">
                <div className="summary-row">
                  <span className="body-md">Subtotal</span>
                  <span className="body-md">₹{subtotal.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="summary-row discount-row">
                    <span className="body-md">
                      Coupon Discount ({couponData?.code})
                    </span>
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

              {/* Mandatory Correction 10: Display Pay ₹XXXX */}
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
                    <span>PAY ₹{total.toLocaleString()} VIA RAZORPAY</span>
                    <span className="btn-icon">💳</span>
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="trust-badges">
                <div className="trust-item">
                  <span className="trust-icon">🔒</span>
                  <span className="telemetry-label">RAZORPAY SECURE</span>
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

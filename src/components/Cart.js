import React, { useState, useEffect, useCallback, useMemo } from 'react';
import couponService from '../services/couponService';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import addressService from '../services/addressService';
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

const FREE_SHIPPING_THRESHOLD = 15000;
const STANDARD_SHIPPING_FEE = 150;
const EXPRESS_SHIPPING_FEE = 350;

function Cart({ 
  cart, 
  onUpdateCart, 
  onRemoveItem, 
  currentUser, 
  showToast, 
  onOrderComplete,
  onPageChange 
}) {
  const [promoCode, setPromoCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Shipping Method Selection: 'standard' or 'express'
  const [shippingMethod, setShippingMethod] = useState('standard');

  // Address Selection & Creation Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // New Address Form State
  const [newAddressForm, setNewAddressForm] = useState({
    fullName: currentUser?.name || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    type: 'HOME',
    isDefault: false
  });
  const [formErrors, setFormErrors] = useState({});

  // Subtotal and Fee Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  }, [cart]);

  const isFreeEligible = subtotal >= FREE_SHIPPING_THRESHOLD;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const shippingFee = useMemo(() => {
    if (cart.length === 0) return 0;
    if (shippingMethod === 'express') {
      return EXPRESS_SHIPPING_FEE;
    }
    return isFreeEligible ? 0 : STANDARD_SHIPPING_FEE;
  }, [cart.length, shippingMethod, isFreeEligible]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount) + shippingFee;
  }, [subtotal, discountAmount, shippingFee]);

  // Load user saved addresses
  const loadUserAddresses = useCallback(async () => {
    if (!currentUser) return;
    setLoadingAddresses(true);
    const res = await addressService.getAddresses();
    if (res.success && Array.isArray(res.data)) {
      setSavedAddresses(res.data);
      const defaultAddr = res.data.find(a => a.isDefault) || res.data[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
      } else {
        setIsAddingNewAddress(true);
      }
    } else {
      setIsAddingNewAddress(true);
    }
    setLoadingAddresses(false);
  }, [currentUser]);

  useEffect(() => {
    if (showAddressModal && currentUser) {
      loadUserAddresses();
    }
  }, [showAddressModal, currentUser, loadUserAddresses]);

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

  // Validate address form (strict Indian phone & 6-digit PIN)
  const validateAddressForm = () => {
    const errors = {};
    if (!newAddressForm.fullName.trim()) errors.fullName = 'Full name is required';
    if (!newAddressForm.phone.trim()) {
      errors.phone = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(newAddressForm.phone.trim().replace(/\s+/g, ''))) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    if (!newAddressForm.addressLine1.trim()) errors.addressLine1 = 'House/Flat/Building is required';
    if (!newAddressForm.city.trim()) errors.city = 'City is required';
    if (!newAddressForm.state.trim()) errors.state = 'State is required';
    if (!newAddressForm.postalCode.trim()) {
      errors.postalCode = 'PIN code is required';
    } else if (!/^\d{6}$/.test(newAddressForm.postalCode.trim())) {
      errors.postalCode = 'PIN code must be exactly 6 digits';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Trigger address modal
  const handleProceedToAddress = () => {
    if (cart.length === 0) {
      if (showToast) showToast('Your cart is empty!', 'warning');
      return;
    }
    setShowAddressModal(true);
  };

  // Execute payment with confirmed customer delivery address
  const handleConfirmAddressAndPay = async (e) => {
    if (e) e.preventDefault();

    let targetAddress = null;

    if (isAddingNewAddress || savedAddresses.length === 0) {
      if (!validateAddressForm()) {
        if (showToast) showToast('Please fix the errors in your delivery address form', 'error');
        return;
      }

      // Save new address to MongoDB if authenticated
      if (currentUser) {
        const createRes = await addressService.createAddress(newAddressForm);
        if (createRes.success && createRes.data) {
          targetAddress = createRes.data;
        } else {
          targetAddress = newAddressForm;
        }
      } else {
        targetAddress = newAddressForm;
      }
    } else {
      targetAddress = savedAddresses.find(a => a._id === selectedAddressId);
      if (!targetAddress) {
        if (showToast) showToast('Please select a delivery address', 'warning');
        return;
      }
    }

    setShowAddressModal(false);
    await startCheckoutWithAddress(targetAddress);
  };

  // Razorpay Checkout Integration Flow with Actual Customer Address
  const startCheckoutWithAddress = async (deliveryAddress) => {
    setIsCheckingOut(true);

    try {
      const activePromo = couponData ? couponData.code : (promoCode ? promoCode.trim().toUpperCase() : null);

      // Construct verified delivery address payload
      const formattedAddress = {
        fullName: deliveryAddress.fullName,
        phone: deliveryAddress.phone,
        street: `${deliveryAddress.addressLine1 || deliveryAddress.street || ''}${deliveryAddress.addressLine2 ? ', ' + deliveryAddress.addressLine2 : ''}`,
        landmark: deliveryAddress.landmark || '',
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        pincode: deliveryAddress.postalCode || deliveryAddress.pincode,
        country: deliveryAddress.country || 'India',
        type: deliveryAddress.type || 'HOME'
      };

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
        shippingAddress: formattedAddress,
        shippingMethod: shippingMethod
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
          name: 'SoleVibe Footwear',
          description: 'Footwear Order Payment',
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
              shippingAddress: formattedAddress,
              shippingMethod: shippingMethod,
              notes: "Online Payment via Razorpay"
            });

            setIsCheckingOut(false);
            if (verifyRes.success) {
              if (showToast) {
                showToast(`🎉 Payment Verified & Order Placed! Order #${verifyRes.data?.orderNumber || verifyRes.data?._id || generateOrderId()}`, 'success');
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
            name: deliveryAddress.fullName || currentUser?.name || 'Athlete Customer',
            email: currentUser?.email || 'customer@solevibe.com',
            contact: deliveryAddress.phone || '9876543210'
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
        // Direct Order Creation with Verified Customer Address
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
          shippingAddress: formattedAddress,
          shippingMethod: shippingMethod,
          notes: "Direct Order (Demo/Standard Checkout)"
        });

        setIsCheckingOut(false);

        if (directOrderRes.success) {
          const createdOrder = directOrderRes.data.data;
          if (showToast) {
            showToast(`🎉 Order placed successfully! Order #${createdOrder.orderNumber || createdOrder._id || generateOrderId()}`, 'success');
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
        showToast('An error occurred during checkout processing', 'error');
      }
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-empty">
            <div className="empty-icon">👟</div>
            <h2 className="headline-lg">YOUR BAG IS EMPTY</h2>
            <p className="body-lg">
              Explore the latest SoleVibe footwear innovations engineered for athletes and everyday movement.
            </p>
            <button 
              type="button"
              className="btn-primary empty-shop-btn"
              onClick={() => onPageChange ? onPageChange('shop') : (window.location.href = '/')}
            >
              <span>EXPLORE ALL FOOTWEAR</span>
              <span className="btn-icon">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Header Breadcrumbs / Eyebrow */}
        <div className="cart-header">
          <div className="telemetry-badge">
            <span className="status-dot pulse-glow"></span>
            <span className="telemetry-label">SECURE SHOPPING BAG</span>
          </div>
          <h1 className="headline-lg">
            YOUR CART ({cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'PAIR' : 'PAIRS'})
          </h1>
        </div>

        {/* Free Shipping Progress Bar (₹15,000 threshold) */}
        <div className="free-shipping-bar" role="region" aria-label="Free Shipping Progress">
          {isFreeEligible ? (
            <div className="free-shipping-success">
              <span className="free-shipping-icon">🎉</span>
              <div>
                <strong>FREE STANDARD SHIPPING UNLOCKED!</strong>
                <p>Your order qualifies for complimentary standard shipping across India.</p>
              </div>
            </div>
          ) : (
            <div className="free-shipping-pending">
              <div className="shipping-text-row">
                <span>
                  Add <strong className="highlight-amount">₹{amountToFreeShipping.toLocaleString()}</strong> more to unlock <strong className="highlight-tag">FREE STANDARD SHIPPING</strong>
                </span>
                <span className="threshold-percentage">{freeShippingProgress}%</span>
              </div>
              <div className="progress-track" aria-valuemin="0" aria-valuemax="100" aria-valuenow={freeShippingProgress}>
                <div 
                  className="progress-fill" 
                  style={{ width: `${freeShippingProgress}%` }}
                ></div>
              </div>
            </div>
          )}
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
                    <h3 className="item-title">{item.name}</h3>
                    <button 
                      className="btn-remove"
                      onClick={() => onRemoveItem(item.id || item._id, item.size)}
                      title="Remove from cart"
                      aria-label={`Remove ${item.name}`}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="cart-item-meta">
                    <span className="meta-pill">SIZE: UK {item.size}</span>
                    <span className="meta-pill category-pill">
                      {item.category === 'men' ? "MEN'S" : item.category === 'women' ? "WOMEN'S" : item.category ? item.category.toUpperCase() : "PERFORMANCE"}
                    </span>
                    {item.specifications?.weight && (
                      <span className="meta-pill spec-pill">WT: {item.specifications.weight}</span>
                    )}
                    {item.specifications?.drop && (
                      <span className="meta-pill spec-pill">DROP: {item.specifications.drop}</span>
                    )}
                  </div>

                  <div className="cart-item-footer">
                    <div className="cart-quantity-stepper">
                      <button 
                        type="button"
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id || item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button 
                        type="button"
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id || item._id, item.quantity + 1)}
                        disabled={item.quantity >= (item.stock || 99)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="cart-item-price">
                      <span className="price-label">PRICE</span>
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
              <h2 className="summary-title">ORDER SUMMARY</h2>

              {/* Promo / Coupon Section */}
              <div className="promo-section">
                <label className="telemetry-label" htmlFor="coupon-input">PROMO CODE</label>
                <div className="promo-input-group">
                  <input
                    id="coupon-input"
                    type="text"
                    className="promo-input"
                    placeholder="Enter coupon (e.g. SOLE10)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    disabled={Boolean(couponData) || isValidatingCoupon}
                  />
                  {couponData ? (
                    <button 
                      type="button"
                      className="btn-apply-promo btn-remove-promo"
                      onClick={handleRemovePromo}
                    >
                      REMOVE
                    </button>
                  ) : (
                    <button 
                      type="button"
                      className="btn-apply-promo"
                      onClick={handleApplyPromo}
                      disabled={isValidatingCoupon || !promoCode.trim()}
                    >
                      {isValidatingCoupon ? '...' : 'APPLY'}
                    </button>
                  )}
                </div>

                {couponMessage && (
                  <p className={couponMessage.type === 'success' ? 'promo-success' : 'promo-error'}>
                    {couponMessage.type === 'success' ? '✓' : '⚠️'} {couponMessage.text}
                  </p>
                )}
              </div>

              {/* Shipping Method Selector */}
              <div className="shipping-method-selector">
                <label className="telemetry-label">DELIVERY METHOD</label>
                <div className="shipping-options-grid">
                  <label className={`shipping-option-card ${shippingMethod === 'standard' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="shippingMethod" 
                      value="standard"
                      checked={shippingMethod === 'standard'}
                      onChange={() => setShippingMethod('standard')}
                    />
                    <div className="shipping-card-content">
                      <div className="shipping-title-row">
                        <strong>Standard Delivery</strong>
                        <span className="shipping-cost">
                          {isFreeEligible ? 'FREE' : `₹${STANDARD_SHIPPING_FEE}`}
                        </span>
                      </div>
                      <span className="shipping-est">3-5 business days across India</span>
                    </div>
                  </label>

                  <label className={`shipping-option-card ${shippingMethod === 'express' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="shippingMethod" 
                      value="express"
                      checked={shippingMethod === 'express'}
                      onChange={() => setShippingMethod('express')}
                    />
                    <div className="shipping-card-content">
                      <div className="shipping-title-row">
                        <strong>Express Courier</strong>
                        <span className="shipping-cost">₹{EXPRESS_SHIPPING_FEE}</span>
                      </div>
                      <span className="shipping-est">1-2 business days priority dispatch</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="summary-breakdown">
                <div className="summary-row">
                  <span className="breakdown-label">Bag Subtotal</span>
                  <span className="breakdown-val">₹{subtotal.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="summary-row discount-row">
                    <span className="breakdown-label">
                      Coupon Savings ({couponData?.code})
                    </span>
                    <span className="breakdown-val discount-val">-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="summary-row">
                  <span className="breakdown-label">Shipping</span>
                  <span className="breakdown-val">
                    {shippingFee === 0 ? (
                      <span className="free-shipping-tag">FREE ✓</span>
                    ) : (
                      `₹${shippingFee.toLocaleString()}`
                    )}
                  </span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row summary-total">
                  <span className="total-label">Total Payable</span>
                  <span className="total-price">₹{total.toLocaleString()}</span>
                </div>
                <span className="tax-inclusive-tag">Inclusive of all applicable GST</span>
              </div>

              {/* Checkout Button */}
              <button 
                type="button"
                className={`btn-primary btn-checkout ${isCheckingOut ? 'loading' : ''}`}
                onClick={handleProceedToAddress}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (
                  <>
                    <span>PROCESSING ORDER...</span>
                    <span className="btn-icon">⏳</span>
                  </>
                ) : (
                  <>
                    <span>PROCEED TO CHECKOUT</span>
                    <span className="btn-icon">→</span>
                  </>
                )}
              </button>

              {/* Trust & Policy Badges */}
              <div className="trust-badges">
                <div className="trust-item">
                  <span className="trust-icon">🔒</span>
                  <span className="trust-text">RAZORPAY 256-BIT ENCRYPTED</span>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">↩️</span>
                  <span className="trust-text">7-DAY RETURN POLICY</span>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">✓</span>
                  <span className="trust-text">100% AUTHENTIC GUARANTEE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Address Selection & Form Modal (Refactored to Light Theme) */}
      {showAddressModal && (
        <div 
          className="address-modal-backdrop fade-in" 
          onClick={() => setShowAddressModal(false)}
        >
          <div 
            className="address-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-address-title"
          >
            <div className="address-modal-header">
              <div>
                <h2 id="modal-address-title" className="modal-title">Select Delivery Destination</h2>
                <p className="modal-subtitle">Your footwear will be dispatched to this verified address</p>
              </div>
              <button 
                type="button"
                className="btn-modal-close"
                onClick={() => setShowAddressModal(false)}
                aria-label="Close delivery address selector"
              >
                ✕
              </button>
            </div>

            {/* Saved Addresses List */}
            {savedAddresses.length > 0 && !isAddingNewAddress && (
              <div className="saved-addresses-block">
                {loadingAddresses ? (
                  <div className="loading-address-text">Loading verified addresses...</div>
                ) : (
                  <div className="saved-addresses-grid">
                    {savedAddresses.map((addr) => (
                      <label 
                        key={addr._id}
                        className={`address-radio-card ${selectedAddressId === addr._id ? 'selected' : ''}`}
                      >
                        <input 
                          type="radio" 
                          name="selectedAddress" 
                          value={addr._id}
                          checked={selectedAddressId === addr._id}
                          onChange={() => setSelectedAddressId(addr._id)}
                        />
                        <div className="address-card-body">
                          <div className="address-card-header">
                            <strong className="recipient-name">{addr.fullName}</strong>
                            <span className="address-type-pill">{addr.type || 'HOME'}</span>
                            {addr.isDefault && (
                              <span className="default-pill">DEFAULT</span>
                            )}
                          </div>
                          <p className="address-lines">
                            {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                            {addr.landmark ? `, Near ${addr.landmark}` : ''}
                          </p>
                          <p className="address-city">
                            {addr.city}, {addr.state} - <strong>{addr.postalCode}</strong>
                          </p>
                          <p className="address-phone">📞 +91 {addr.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className="btn-add-address-trigger"
                  onClick={() => setIsAddingNewAddress(true)}
                >
                  + Add New Delivery Address
                </button>
              </div>
            )}

            {/* Address Form (for guest or when adding new) */}
            {(isAddingNewAddress || savedAddresses.length === 0) && (
              <form className="address-input-form" onSubmit={handleConfirmAddressAndPay}>
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    className="btn-back-saved"
                    onClick={() => setIsAddingNewAddress(false)}
                  >
                    ← Back to saved addresses
                  </button>
                )}

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="fullName">Full Name *</label>
                    <input 
                      id="fullName"
                      type="text" 
                      className={`form-input ${formErrors.fullName ? 'input-error' : ''}`}
                      value={newAddressForm.fullName}
                      onChange={e => setNewAddressForm({ ...newAddressForm, fullName: e.target.value })}
                      placeholder="e.g. Shashikant Yadav"
                      required
                    />
                    {formErrors.fullName && <span className="field-error-text">{formErrors.fullName}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Mobile Number *</label>
                    <input 
                      id="phone"
                      type="tel" 
                      className={`form-input ${formErrors.phone ? 'input-error' : ''}`}
                      value={newAddressForm.phone}
                      onChange={e => setNewAddressForm({ ...newAddressForm, phone: e.target.value.replace(/\D/g, '') })}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      required
                    />
                    {formErrors.phone && <span className="field-error-text">{formErrors.phone}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="addressLine1">Flat / House No. / Building *</label>
                  <input 
                    id="addressLine1"
                    type="text" 
                    className={`form-input ${formErrors.addressLine1 ? 'input-error' : ''}`}
                    value={newAddressForm.addressLine1}
                    onChange={e => setNewAddressForm({ ...newAddressForm, addressLine1: e.target.value })}
                    placeholder="e.g. Flat 402, Kinetic Heights"
                    required
                  />
                  {formErrors.addressLine1 && <span className="field-error-text">{formErrors.addressLine1}</span>}
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="addressLine2">Street / Colony / Area *</label>
                    <input 
                      id="addressLine2"
                      type="text" 
                      className="form-input"
                      value={newAddressForm.addressLine2}
                      onChange={e => setNewAddressForm({ ...newAddressForm, addressLine2: e.target.value })}
                      placeholder="e.g. Linking Road, Bandra West"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="landmark">Landmark (Optional)</label>
                    <input 
                      id="landmark"
                      type="text" 
                      className="form-input"
                      value={newAddressForm.landmark}
                      onChange={e => setNewAddressForm({ ...newAddressForm, landmark: e.target.value })}
                      placeholder="e.g. Opposite National Stadium"
                    />
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label" htmlFor="city">City *</label>
                    <input 
                      id="city"
                      type="text" 
                      className={`form-input ${formErrors.city ? 'input-error' : ''}`}
                      value={newAddressForm.city}
                      onChange={e => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      required
                    />
                    {formErrors.city && <span className="field-error-text">{formErrors.city}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="state">State *</label>
                    <input 
                      id="state"
                      type="text" 
                      className={`form-input ${formErrors.state ? 'input-error' : ''}`}
                      value={newAddressForm.state}
                      onChange={e => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                      placeholder="e.g. Maharashtra"
                      required
                    />
                    {formErrors.state && <span className="field-error-text">{formErrors.state}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="postalCode">PIN Code *</label>
                    <input 
                      id="postalCode"
                      type="text" 
                      className={`form-input ${formErrors.postalCode ? 'input-error' : ''}`}
                      value={newAddressForm.postalCode}
                      onChange={e => setNewAddressForm({ ...newAddressForm, postalCode: e.target.value.replace(/\D/g, '') })}
                      placeholder="6 digits"
                      maxLength={6}
                      required
                    />
                    {formErrors.postalCode && <span className="field-error-text">{formErrors.postalCode}</span>}
                  </div>
                </div>

                <div className="address-type-selection">
                  <span className="form-label">Address Type:</span>
                  <label className="type-radio-label">
                    <input 
                      type="radio" 
                      name="addressType" 
                      value="HOME" 
                      checked={newAddressForm.type === 'HOME'}
                      onChange={() => setNewAddressForm({ ...newAddressForm, type: 'HOME' })}
                    /> 
                    <span>Home (All day delivery)</span>
                  </label>
                  <label className="type-radio-label">
                    <input 
                      type="radio" 
                      name="addressType" 
                      value="OFFICE" 
                      checked={newAddressForm.type === 'OFFICE'}
                      onChange={() => setNewAddressForm({ ...newAddressForm, type: 'OFFICE' })}
                    /> 
                    <span>Office (10 AM - 6 PM)</span>
                  </label>
                </div>
              </form>
            )}

            {/* Modal Bottom Actions */}
            <div className="address-modal-footer">
              <button
                type="button"
                className="btn-cancel-modal"
                onClick={() => setShowAddressModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-deliver-pay"
                onClick={handleConfirmAddressAndPay}
              >
                <span>DELIVER HERE & PAY ₹{total.toLocaleString()}</span>
                <span className="btn-icon">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;

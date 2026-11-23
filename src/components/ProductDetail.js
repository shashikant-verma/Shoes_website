import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import reviewService from '../services/reviewService';
import authService from '../services/authService';
import productService from '../services/productService';
import api from '../services/api';
import ProductCard from './ProductCard';
import RecentlyViewed, { recordRecentlyViewed } from './RecentlyViewed';
import './ProductDetail.css';

function ProductDetail({ 
  product: initialProduct, 
  productSlug, 
  onClose, 
  onAddToCart, 
  onAddToWishlist, 
  isInWishlist = false,
  onPageChange 
}) {
  const [product, setProduct] = useState(initialProduct || null);
  const [loadingProduct, setLoadingProduct] = useState(!initialProduct && Boolean(productSlug));
  const [productError, setProductError] = useState(null);

  // Size selection & validation
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({ display: 'none', backgroundPosition: '0% 0%' });

  // Size guide modal
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Live Pincode Shipping Estimator State
  const [pincode, setPincode] = useState('');
  const [shippingCalcResult, setShippingCalcResult] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState(null);

  // Related products from MongoDB
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    reviewCount: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Review Form state
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // 1. Fetch Product if not provided or if slug changed
  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      setLoadingProduct(false);
      setProductError(null);
    } else if (productSlug) {
      setLoadingProduct(true);
      setProductError(null);
      productService.getProduct(productSlug)
        .then((res) => {
          if (res.success && res.data) {
            setProduct(res.data);
          } else {
            setProductError(res.message || 'Footwear not found');
          }
        })
        .catch((err) => {
          console.error('Failed to load product:', err);
          setProductError('Failed to load footwear details.');
        })
        .finally(() => setLoadingProduct(false));
    }
  }, [initialProduct, productSlug]);

  // Record recently viewed when product is ready
  useEffect(() => {
    if (product) {
      recordRecentlyViewed(product);
    }
  }, [product]);

  const productId = product?._id || product?.id;

  // 2. Load Reviews from Real API
  const loadReviewsData = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await reviewService.getProductReviews(productId);
      if (res.success) {
        setReviews(res.data || []);
        if (res.summary) {
          setSummary(res.summary);
        }
      }

      if (authService.isAuthenticated()) {
        const userRes = await reviewService.getMyReview(productId);
        if (userRes.success) {
          setIsVerifiedBuyer(Boolean(userRes.isVerifiedBuyer));
          setMyReview(userRes.myReview || null);
          if (userRes.myReview) {
            setFormRating(userRes.myReview.rating || 5);
            setFormTitle(userRes.myReview.title || '');
            setFormComment(userRes.myReview.comment || '');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  }, [productId]);

  useEffect(() => {
    loadReviewsData();
  }, [loadReviewsData]);

  // 3. Load Related Products from MongoDB (Same Category / Collection)
  useEffect(() => {
    if (!product) return;
    let isMounted = true;

    const query = {
      status: 'active',
      limit: 5
    };
    if (product.category && product.category !== 'all') {
      query.category = product.category;
    }

    productService.getProducts(query)
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data?.data)) {
          // Exclude the current product from recommendations
          const filtered = res.data.data
            .filter((p) => (p._id || p.id) !== productId)
            .slice(0, 4);
          setRelatedProducts(filtered);
        }
      })
      .catch((err) => console.error('Failed to fetch related products:', err));

    return () => { isMounted = false; };
  }, [product, productId]);

  // 4. Live Pincode Shipping Calculation (using POST /api/shipping/calculate)
  const handleCheckShipping = async (e) => {
    if (e) e.preventDefault();
    if (!pincode || pincode.trim().length !== 6 || !/^\d{6}$/.test(pincode.trim())) {
      setShippingError('Please enter a valid 6-digit Indian PIN code');
      setShippingCalcResult(null);
      return;
    }

    setShippingLoading(true);
    setShippingError(null);

    try {
      const response = await api.post('/shipping/calculate', {
        subtotal: product.price * quantity,
        method: 'standard',
        address: {
          pincode: pincode.trim(),
          country: 'India'
        }
      });

      if (response.data?.success && response.data?.data) {
        setShippingCalcResult(response.data.data);
      } else {
        setShippingError(response.data?.message || 'Delivery unavailable for this destination PIN code');
        setShippingCalcResult(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to calculate delivery estimate for this PIN code';
      setShippingError(msg);
      setShippingCalcResult(null);
    } finally {
      setShippingLoading(false);
    }
  };

  // Image Gallery calculations
  const allImages = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    return product.image ? [product.image] : [];
  }, [product]);

  const currentDisplayImage = allImages[activeImageIndex] || product?.image || '';

  // Desktop Hover-Zoom Lens Handler
  const handleMouseMoveZoom = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${currentDisplayImage})`,
      backgroundPosition: `${x}% ${y}%`
    });
  };

  const handleMouseLeaveZoom = () => {
    setZoomStyle({ display: 'none', backgroundPosition: '0% 0%' });
  };

  // Size and Stock calculations
  const isOutOfStock = !product || Number(product.stock) === 0;
  const availableSizes = useMemo(() => {
    if (!product || !Array.isArray(product.sizes)) return [];
    return product.sizes;
  }, [product]);

  // Standard UK/India sizing list to render a complete matrix
  const standardSizingList = useMemo(() => {
    const defaultGrid = ['6', '7', '8', '9', '10', '11', '12'];
    const merged = Array.from(new Set([...defaultGrid, ...availableSizes.map(s => s.replace(/UK\s*/i, ''))]));
    return merged.sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [availableSizes]);

  // Mobile Sticky Bottom Bar State and Ref
  const [showStickyBar, setShowStickyBar] = useState(false);
  const actionsRowRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth <= 768) {
        if (actionsRowRef.current) {
          const rect = actionsRowRef.current.getBoundingClientRect();
          setShowStickyBar(rect.bottom < 0);
        } else {
          setShowStickyBar(window.scrollY > 400);
        }
      } else {
        setShowStickyBar(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Handle Add to Cart
  const handleAddToCartClick = () => {
    if (isOutOfStock) return;
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 3500);
      return;
    }

    setSizeError(false);
    if (onAddToCart) {
      onAddToCart({
        ...product,
        size: selectedSize,
        quantity: quantity
      });
    }

    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleStickyAddToCart = () => {
    if (!selectedSize) {
      if (actionsRowRef.current) {
        actionsRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      handleAddToCartClick();
    } else {
      handleAddToCartClick();
    }
  };

  // Handle Buy Now (Instant Checkout Flow)
  const handleBuyNowClick = () => {
    if (isOutOfStock) return;
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 3500);
      return;
    }

    setSizeError(false);
    if (onAddToCart) {
      onAddToCart({
        ...product,
        size: selectedSize,
        quantity: quantity
      });
    }

    // Transition immediately to Cart to initiate the verified checkout flow
    if (onPageChange) {
      if (onClose) onClose();
      onPageChange('cart');
    }
  };

  // Review Form handlers
  const handleStartEdit = () => {
    if (myReview) {
      setFormRating(myReview.rating);
      setFormTitle(myReview.title || '');
      setFormComment(myReview.comment || '');
      setIsEditing(true);
      setShowWriteForm(true);
      setFormError('');
      setFormSuccess('');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formComment.trim()) {
      setFormError('Please enter a review comment');
      return;
    }

    setSubmittingReview(true);
    try {
      let res;
      if (isEditing && myReview) {
        res = await reviewService.updateReview(myReview._id, {
          rating: formRating,
          title: formTitle,
          comment: formComment
        });
      } else {
        res = await reviewService.createReview({
          productId,
          rating: formRating,
          title: formTitle,
          comment: formComment
        });
      }

      if (res.success) {
        setFormSuccess(res.message || 'Review submitted successfully');
        setShowWriteForm(false);
        setIsEditing(false);
        await loadReviewsData();
      } else {
        setFormError(res.message || 'Failed to submit review');
      }
    } catch (err) {
      setFormError('An error occurred while submitting your review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;
    if (window.confirm('Are you sure you want to delete your review?')) {
      const res = await reviewService.deleteReview(myReview._id);
      if (res.success) {
        setMyReview(null);
        setShowWriteForm(false);
        setIsEditing(false);
        await loadReviewsData();
      } else {
        alert(res.message || 'Failed to delete review');
      }
    }
  };

  // Helper to render star rating symbols
  const renderStars = (score) => {
    const rounded = Math.round(score || 0);
    return '★'.repeat(rounded) + '☆'.repeat(Math.max(0, 5 - rounded));
  };

  // Loading State
  if (loadingProduct) {
    return (
      <div className="pdp-loading-container" aria-live="polite">
        <div className="pdp-skeleton-header" />
        <div className="pdp-skeleton-grid">
          <div className="pdp-skeleton-gallery" />
          <div className="pdp-skeleton-console">
            <div className="skeleton-line title" />
            <div className="skeleton-line price" />
            <div className="skeleton-line rating" />
            <div className="skeleton-line sizes" />
            <div className="skeleton-line button" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (productError || !product) {
    return (
      <div className="pdp-error-container" role="alert">
        <span className="pdp-error-icon">👟</span>
        <h2 className="pdp-error-title">FOOTWEAR NOT FOUND</h2>
        <p className="pdp-error-desc">
          {productError || 'The footwear product you are looking for is unavailable or discontinued.'}
        </p>
        <button 
          type="button" 
          className="btn-primary"
          onClick={() => onPageChange ? onPageChange('shop') : (onClose && onClose())}
        >
          <span>BROWSE CATALOG</span>
          <span className="btn-icon">→</span>
        </button>
      </div>
    );
  }

  const specs = product.specifications || {};
  const hasValidSpecs = Boolean(
    specs.weight || specs.drop || specs.sole || specs.material || specs.use || specs.closure
  );

  return (
    <div className="pdp-page-container" id="product-detail-view">
      {/* 1. Breadcrumb & Navigation Bar */}
      <nav className="pdp-breadcrumb-nav" aria-label="Breadcrumb">
        <div className="pdp-container breadcrumb-row">
          <div className="breadcrumb-trail">
            <button 
              type="button" 
              className="breadcrumb-link" 
              onClick={() => onPageChange ? onPageChange('home') : (onClose && onClose())}
            >
              HOME
            </button>
            <span className="breadcrumb-sep">/</span>
            <button 
              type="button" 
              className="breadcrumb-link" 
              onClick={() => onPageChange ? onPageChange('shop') : (onClose && onClose())}
            >
              SHOP
            </button>
            <span className="breadcrumb-sep">/</span>
            <button 
              type="button" 
              className="breadcrumb-link" 
              onClick={() => onPageChange ? onPageChange(product.category || 'shop') : (onClose && onClose())}
            >
              {product.category?.toUpperCase() || 'FOOTWEAR'}
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current" aria-current="page">{product.name}</span>
          </div>

          <button 
            type="button" 
            className="pdp-back-btn" 
            onClick={() => onClose ? onClose() : (onPageChange && onPageChange('shop'))}
            aria-label="Return to collection"
          >
            ← BACK TO COLLECTION
          </button>
        </div>
      </nav>

      {/* 2. Main Two-Column Shopping Grid */}
      <div className="pdp-container">
        <div className="pdp-main-grid">
          
          {/* Left Column (55%): Media Gallery & High-Res Viewport */}
          <div className="pdp-gallery-col">
            <div className="pdp-gallery-sticky">
              
              {/* Thumbnail Strip (Vertical Desktop / Horizontal Mobile) */}
              {allImages.length > 1 && (
                <div className="pdp-thumbnails-strip" role="tablist" aria-label="Product angles">
                  {allImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={activeImageIndex === idx}
                      aria-label={`View angle ${idx + 1}`}
                      className={`pdp-thumb-item ${activeImageIndex === idx ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(idx)}
                    >
                      <img src={imgUrl} alt={`${product.name} view ${idx + 1}`} loading="lazy" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image Viewport with Hover-Zoom Lens */}
              <div 
                className="pdp-main-viewport"
                onMouseMove={handleMouseMoveZoom}
                onMouseLeave={handleMouseLeaveZoom}
                onClick={() => setIsLightboxOpen(true)}
              >
                {/* Floating Badge */}
                {isOutOfStock ? (
                  <span className="pdp-card-badge badge-soldout">SOLD OUT</span>
                ) : product.discount && product.discount > 0 && product.originalPrice && product.originalPrice > product.price ? (
                  <span className="pdp-card-badge badge-sale">-{product.discount}% OFF</span>
                ) : product.isNew ? (
                  <span className="pdp-card-badge badge-new">NEW ARRIVAL</span>
                ) : product.badge ? (
                  <span className="pdp-card-badge badge-featured">{product.badge}</span>
                ) : null}

                {/* Main Shoe Image */}
                <img 
                  src={currentDisplayImage} 
                  alt={product.name} 
                  className="pdp-hero-image"
                  decoding="async" 
                />

                {/* Zoom Hint Overlay */}
                <div className="pdp-zoom-hint" aria-hidden="true">
                  <span>🔍 Hover to Zoom • Click to Expand</span>
                </div>

                {/* Interactive Zoom Lens Viewport */}
                <div 
                  className="pdp-zoom-lens"
                  style={zoomStyle}
                  aria-hidden="true"
                />
              </div>

            </div>
          </div>

          {/* Right Column (45%): Purchase Console */}
          <div className="pdp-console-col">
            <div className="pdp-console-inner">
              
              {/* Category Eyebrow & Brand */}
              <div className="pdp-eyebrow-row">
                <span className="pdp-category-eyebrow">
                  {product.brand?.toUpperCase() || 'SOLEVIBE'} • {product.category?.toUpperCase() || 'RUNNING'}
                </span>
                <span className="pdp-sku-label">SKU: {product.sku || 'SV-CORE'}</span>
              </div>

              {/* Product Title */}
              <h1 className="pdp-product-title">{product.name}</h1>

              {/* Rating Quick Jump */}
              <div className="pdp-rating-row">
                <a href="#reviews-section" className="pdp-rating-anchor">
                  <span className="pdp-stars-gold">{renderStars(summary.averageRating || product.rating)}</span>
                  <span className="pdp-rating-score">
                    {(summary.averageRating || product.rating || 0).toFixed(1)}
                  </span>
                  <span className="pdp-review-count">
                    ({summary.reviewCount || product.reviewCount || 0} customer reviews)
                  </span>
                </a>
              </div>

              {/* Price Block */}
              <div className="pdp-price-container">
                <div className="pdp-price-row">
                  <span className="pdp-current-price">
                    ₹{Number(product.price || 0).toLocaleString()}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="pdp-original-price">
                      ₹{Number(product.originalPrice).toLocaleString()}
                    </span>
                  )}
                  {product.discount && product.discount > 0 && product.originalPrice > product.price && (
                    <span className="pdp-discount-tag">
                      SAVE {product.discount}%
                    </span>
                  )}
                </div>
                <span className="pdp-tax-notice">Inclusive of all local taxes</span>
              </div>

              {/* Sizing Console */}
              <div className="pdp-size-section">
                <div className="size-header-row">
                  <span className="size-section-label">
                    SELECT SIZE (UK/INDIA):
                  </span>
                  <button 
                    type="button" 
                    className="pdp-size-guide-btn"
                    onClick={() => setShowSizeGuide(true)}
                  >
                    📏 Size Guide
                  </button>
                </div>

                {sizeError && (
                  <div className="pdp-size-error-banner" role="alert">
                    ⚠️ Please select your shoe size before adding to cart
                  </div>
                )}

                {/* Sizing Matrix */}
                <div className="pdp-sizes-grid" role="radiogroup" aria-label="Shoe sizes">
                  {standardSizingList.map((sz) => {
                    const isAvailable = availableSizes.includes(sz) || availableSizes.includes(`UK ${sz}`);
                    const isSelectable = isAvailable && !isOutOfStock;
                    const isSelected = selectedSize === sz;

                    return (
                      <button
                        key={sz}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={!isSelectable}
                        className={`pdp-size-tile ${isSelected ? 'selected' : ''} ${!isSelectable ? 'unavailable' : ''}`}
                        onClick={() => {
                          if (isSelectable) {
                            setSelectedSize(sz);
                            setSizeError(false);
                          }
                        }}
                      >
                        <span className="size-val">{sz}</span>
                        {!isSelectable && <span className="slash-strike" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity & Stock Display */}
              <div className="pdp-quantity-section">
                <span className="qty-label">QUANTITY:</span>
                <div className="qty-controls">
                  <button 
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="qty-number" aria-live="polite">
                    {isOutOfStock ? 0 : quantity}
                  </span>
                  <button 
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock || isOutOfStock}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <span className={`pdp-stock-indicator ${isOutOfStock ? 'stock-empty' : 'stock-available'}`}>
                  {isOutOfStock 
                    ? '● Out of Stock' 
                    : `● In Stock (${product.stock} pairs available)`}
                </span>
              </div>

              {/* Action Buttons: Add to Bag + Buy Now + Wishlist */}
              <div className="pdp-actions-row" ref={actionsRowRef}>
                <button
                  type="button"
                  className={`btn-primary pdp-add-cart-btn ${addedFeedback ? 'added' : ''}`}
                  onClick={handleAddToCartClick}
                  disabled={isOutOfStock}
                >
                  <span>{addedFeedback ? 'ADDED TO BAG ✓' : isOutOfStock ? 'OUT OF STOCK' : 'ADD TO BAG'}</span>
                  {!addedFeedback && !isOutOfStock && <span className="btn-icon">→</span>}
                </button>

                <button
                  type="button"
                  className="btn-pdp-buy-now"
                  onClick={handleBuyNowClick}
                  disabled={isOutOfStock}
                >
                  <span>{isOutOfStock ? 'UNAVAILABLE' : 'INSTANT BUY NOW'}</span>
                </button>

                <button
                  type="button"
                  className={`pdp-wishlist-toggle ${isInWishlist ? 'active' : ''}`}
                  onClick={() => onAddToWishlist && onAddToWishlist(product)}
                  title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <span className="heart-icon" aria-hidden="true">
                    {isInWishlist ? '♥' : '♡'}
                  </span>
                </button>
              </div>

              {/* Live Shipping & Delivery Estimator via POST /api/shipping/calculate */}
              <div className="pdp-shipping-calculator">
                <span className="shipping-box-title">🚚 CHECK DELIVERY & PINCODE</span>
                <form onSubmit={handleCheckShipping} className="shipping-pincode-form">
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="Enter 6-digit Indian PIN code..."
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="pincode-input"
                    aria-label="Enter 6-digit PIN code"
                  />
                  <button 
                    type="submit" 
                    className="pincode-check-btn"
                    disabled={shippingLoading}
                  >
                    {shippingLoading ? 'CHECKING...' : 'CHECK'}
                  </button>
                </form>

                {shippingError && (
                  <p className="shipping-feedback-error" role="alert">
                    ⚠ {shippingError}
                  </p>
                )}

                {shippingCalcResult && (
                  <div className="shipping-calc-card" role="status">
                    <div className="shipping-calc-header">
                      <span className="zone-tag">ZONE: {shippingCalcResult.zone}</span>
                      <span className="shipping-fee-pill">
                        {shippingCalcResult.charge === 0 
                          ? 'FREE DELIVERY' 
                          : `SHIPPING: ₹${shippingCalcResult.charge}`}
                      </span>
                    </div>
                    <p className="delivery-date-statement">
                      Estimated Delivery by <strong>
                        {new Date(shippingCalcResult.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </strong> ({shippingCalcResult.deliveryRange})
                    </p>
                  </div>
                )}
              </div>

              {/* Value Propositions & Policies */}
              <div className="pdp-value-props">
                <div className="prop-item">
                  <span className="prop-icon">🔄</span>
                  <div className="prop-text">
                    <strong>7-Day Return Policy Guarantee</strong>
                    <span>Compliant with backend return window.</span>
                  </div>
                </div>
                <div className="prop-item">
                  <span className="prop-icon">🔒</span>
                  <div className="prop-text">
                    <strong>100% Secure Checkout</strong>
                    <span>Razorpay 256-bit SSL encrypted transactions.</span>
                  </div>
                </div>
              </div>

              {/* Biomechanical Telemetry Chips (Genuine Database Specs Only) */}
              {hasValidSpecs && (
                <div className="pdp-telemetry-section">
                  <h3 className="section-subheading">TECHNICAL SPECIFICATIONS</h3>
                  <div className="telemetry-specs-grid">
                    {specs.weight && (
                      <div className="telemetry-card">
                        <span className="spec-label">WEIGHT</span>
                        <span className="spec-metric">{specs.weight}</span>
                      </div>
                    )}
                    {specs.drop && (
                      <div className="telemetry-card">
                        <span className="spec-label">DROP</span>
                        <span className="spec-metric">{specs.drop}</span>
                      </div>
                    )}
                    {specs.sole && (
                      <div className="telemetry-card">
                        <span className="spec-label">SOLE COMPOSITION</span>
                        <span className="spec-metric">{specs.sole}</span>
                      </div>
                    )}
                    {specs.use && (
                      <div className="telemetry-card">
                        <span className="spec-label">INTENDED USE</span>
                        <span className="spec-metric">{specs.use}</span>
                      </div>
                    )}
                    {specs.material && (
                      <div className="telemetry-card">
                        <span className="spec-label">UPPER MATERIAL</span>
                        <span className="spec-metric">{specs.material}</span>
                      </div>
                    )}
                    {specs.closure && (
                      <div className="telemetry-card">
                        <span className="spec-label">CLOSURE SYSTEM</span>
                        <span className="spec-metric">{specs.closure}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Product Narrative & Features */}
              <div className="pdp-narrative-section">
                <h3 className="section-subheading">PRODUCT STORY</h3>
                <p className="pdp-description-text">{product.description}</p>

                {Array.isArray(product.features) && product.features.length > 0 && (
                  <ul className="pdp-features-list">
                    {product.features.map((feat, i) => (
                      <li key={i}>
                        <span className="check-icon">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 3. Customer Reviews & Ratings Suite */}
      <section className="pdp-reviews-section" id="reviews-section" aria-label="Customer Reviews">
        <div className="pdp-container">
          <div className="reviews-section-header">
            <div>
              <span className="pdp-category-eyebrow">COMMUNITY FEEDBACK</span>
              <h2 className="headline-lg">CUSTOMER REVIEWS & RATINGS</h2>
            </div>
            <span className="verified-badge-label">✓ Authentic Verified Buyers</span>
          </div>

          {/* Rating Summary Breakdown */}
          <div className="reviews-summary-grid">
            <div className="summary-score-card">
              <span className="score-big">{(summary.averageRating || 0).toFixed(1)}</span>
              <span className="score-stars-gold">{renderStars(summary.averageRating)}</span>
              <span className="score-count-label">
                Based on {summary.reviewCount || 0} verified customer reviews
              </span>
            </div>

            <div className="summary-bars-col">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.distribution[star] || 0;
                const pct = summary.reviewCount > 0 ? (count / summary.reviewCount) * 100 : 0;
                return (
                  <div key={star} className="rating-bar-row">
                    <span className="bar-num">{star} ★</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="bar-count-label">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Review Action Area */}
          <div className="user-review-action-banner">
            {!authService.isAuthenticated() ? (
              <div className="review-notice-box">
                <span>🔒 Please sign in and purchase this footwear to leave a verified athlete review.</span>
              </div>
            ) : myReview ? (
              <div className="my-review-card">
                <div className="my-review-top">
                  <div>
                    <span className="my-review-tag">YOUR PUBLISHED REVIEW</span>
                    <span className="my-review-stars">{renderStars(myReview.rating)}</span>
                  </div>
                  <div className="my-review-btn-row">
                    <button type="button" className="btn-edit-rev" onClick={handleStartEdit}>
                      Edit Review
                    </button>
                    <button type="button" className="btn-delete-rev" onClick={handleDeleteReview}>
                      Delete
                    </button>
                  </div>
                </div>
                {myReview.title && <h4 className="my-review-title">{myReview.title}</h4>}
                <p className="my-review-body">{myReview.comment}</p>
              </div>
            ) : isVerifiedBuyer ? (
              !showWriteForm && (
                <div className="write-review-prompt">
                  <div>
                    <h3>Own this pair?</h3>
                    <p>Help the SoleVibe athlete community by leaving an authentic review.</p>
                  </div>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={() => setShowWriteForm(true)}
                  >
                    <span>WRITE A VERIFIED REVIEW</span>
                    <span className="btn-icon">✍</span>
                  </button>
                </div>
              )
            ) : (
              <div className="review-notice-box">
                <span>🔒 <strong>Verified Buyer Only</strong>: Only verified purchasers of this footwear model can leave an approved review.</span>
              </div>
            )}
          </div>

          {/* Review Submission Form */}
          {showWriteForm && (
            <form className="pdp-review-form" onSubmit={handleSubmitReview}>
              <h3 className="form-heading">
                {isEditing ? 'Edit Your Review' : 'Write a Verified Review'}
              </h3>

              {formError && <div className="form-alert error">⚠ {formError}</div>}
              {formSuccess && <div className="form-alert success">✓ {formSuccess}</div>}

              <div className="form-group">
                <label>Overall Rating *</label>
                <div className="star-picker-row">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`star-pick-btn ${s <= formRating ? 'active' : ''}`}
                      onClick={() => setFormRating(s)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-tag">{formRating} out of 5 Stars</span>
                </div>
              </div>

              <div className="form-group">
                <label>Review Headline (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Exceptional cushioning and responsiveness on asphalt"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Your Review Experience *</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="Describe comfort, fit, road articulation, and durability..."
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  maxLength={1000}
                  required
                />
              </div>

              <div className="form-btn-row">
                <button type="submit" className="btn-primary" disabled={submittingReview}>
                  <span>{submittingReview ? 'SUBMITTING...' : isEditing ? 'UPDATE REVIEW' : 'SUBMIT REVIEW'}</span>
                </button>
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowWriteForm(false)}
                  disabled={submittingReview}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Approved Reviews List */}
          <div className="pdp-reviews-list">
            <h3 className="reviews-list-title">Verified Customer Experiences</h3>

            {reviews.length === 0 ? (
              <div className="pdp-no-reviews">
                <p>No verified customer reviews have been published yet for this footwear.</p>
              </div>
            ) : (
              <div className="pdp-reviews-grid">
                {reviews.map((rev) => (
                  <div key={rev._id} className="pdp-review-card">
                    <div className="review-card-top">
                      <div>
                        <span className="reviewer-name">{rev.user?.name || 'Verified Athlete'}</span>
                        {rev.isVerifiedPurchase && (
                          <span className="reviewer-verified">✓ Verified Purchase</span>
                        )}
                      </div>
                      <span className="review-date">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="review-card-stars">{renderStars(rev.rating)}</div>
                    {rev.title && <h4 className="review-card-title">{rev.title}</h4>}
                    <p className="review-card-text">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Related Footwear Recommendations (from MongoDB) */}
      {relatedProducts.length > 0 && (
        <section className="pdp-related-section" aria-label="Related Footwear">
          <div className="pdp-container">
            <div className="related-section-header">
              <span className="pdp-category-eyebrow">EXPLORE SIMILAR SILHOUETTES</span>
              <h2 className="headline-lg">YOU MIGHT ALSO LIKE</h2>
            </div>

            <div className="related-products-grid">
              {relatedProducts.map((relProd, idx) => (
                <ProductCard
                  key={relProd._id || relProd.id}
                  product={relProd}
                  index={idx}
                  onProductClick={(p) => {
                    if (onPageChange) {
                      // Navigate to product by updating URL slug
                      const url = new URL(window.location);
                      url.searchParams.set('product', p.slug || p._id);
                      window.history.pushState({ page: 'product', slug: p.slug || p._id }, '', url.toString());
                      setProduct(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  onAddToCart={onAddToCart}
                  isInWishlist={false}
                  onToggleWishlist={onAddToWishlist}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Recently Viewed Shoes */}
      <div className="pdp-container">
        <RecentlyViewed 
          currentProductId={productId}
          onProductClick={(p) => {
            if (p) {
              const url = new URL(window.location);
              url.searchParams.set('product', p.slug || p._id);
              window.history.pushState({ page: 'product', slug: p.slug || p._id }, '', url.toString());
              setProduct(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          isInWishlist={isInWishlist}
          onToggleWishlist={onAddToWishlist}
        />
      </div>

      {/* 6. International Size Guide Modal */}
      {showSizeGuide && (
        <div className="modal-backdrop fade-in" onClick={() => setShowSizeGuide(false)}>
          <div 
            className="size-guide-modal" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Size Conversion Guide"
          >
            <button 
              type="button"
              className="modal-close-btn" 
              onClick={() => setShowSizeGuide(false)}
              aria-label="Close size guide"
            >
              ✕
            </button>
            <h2 className="size-guide-title">FOOTWEAR SIZE CONVERSION GUIDE</h2>
            <p className="size-guide-subtitle">
              SoleVibe shoe sizes conform to standard international sizing metrics.
            </p>
            <div className="table-responsive">
              <table className="size-table">
                <thead>
                  <tr>
                    <th>UK / India</th>
                    <th>US Men</th>
                    <th>US Women</th>
                    <th>EU Size</th>
                    <th>Foot Length (CM)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>UK 6</td><td>7.0</td><td>8.5</td><td>40.0</td><td>25.0 cm</td></tr>
                  <tr><td>UK 7</td><td>8.0</td><td>9.5</td><td>41.0</td><td>25.8 cm</td></tr>
                  <tr><td>UK 8</td><td>9.0</td><td>10.5</td><td>42.5</td><td>26.7 cm</td></tr>
                  <tr><td>UK 9</td><td>10.0</td><td>11.5</td><td>44.0</td><td>27.5 cm</td></tr>
                  <tr><td>UK 10</td><td>11.0</td><td>12.5</td><td>45.0</td><td>28.3 cm</td></tr>
                  <tr><td>UK 11</td><td>12.0</td><td>13.5</td><td>46.0</td><td>29.2 cm</td></tr>
                  <tr><td>UK 12</td><td>13.0</td><td>14.5</td><td>47.5</td><td>30.0 cm</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Fullscreen Lightbox Image Viewer */}
      {isLightboxOpen && (
        <div className="pdp-lightbox-overlay fade-in" onClick={() => setIsLightboxOpen(false)}>
          <div className="pdp-lightbox-box" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button"
              className="pdp-lightbox-close" 
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close fullscreen view"
            >
              ✕
            </button>
            <img 
              src={currentDisplayImage} 
              alt={product.name} 
              className="pdp-lightbox-img" 
            />
          </div>
        </div>
      )}

      {/* 8. Mobile Sticky Bottom Purchase Bar */}
      {product && (
        <div 
          className={`pdp-mobile-sticky-bar ${showStickyBar ? 'visible' : ''}`} 
          role="region" 
          aria-label="Quick Purchase Bar"
        >
          <div className="pdp-sticky-bar-inner">
            <div className="pdp-sticky-thumb-box">
              <img 
                src={currentDisplayImage} 
                alt={product.name} 
                className="pdp-sticky-thumb-img" 
              />
            </div>
            <div className="pdp-sticky-details">
              <span className="pdp-sticky-name">{product.name}</span>
              <div className="pdp-sticky-meta">
                <span className="pdp-sticky-price">₹{Number(product.price || 0).toLocaleString()}</span>
                <span className="pdp-sticky-size-pill">
                  {selectedSize ? `UK ${selectedSize.size}` : 'Select Size'}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={`btn-primary pdp-sticky-cta ${addedFeedback ? 'added' : ''}`}
              onClick={handleStickyAddToCart}
              disabled={isOutOfStock}
              aria-label={addedFeedback ? 'Added to bag' : isOutOfStock ? 'Sold out' : 'Add to bag'}
            >
              <span>{addedFeedback ? 'ADDED ✓' : isOutOfStock ? 'SOLD OUT' : 'ADD TO BAG'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(ProductDetail);

import React, { useState, useEffect, useCallback } from 'react';
import reviewService from '../services/reviewService';
import authService from '../services/authService';
import './ProductDetail.css';

function ProductDetail({ product, onClose, onAddToCart, onAddToWishlist, isInWishlist }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    averageRating: product.rating || 0,
    reviewCount: product.reviewCount || 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const specs = product.specifications || {};
  const features = product.features || [];
  const sizes = product.sizes || [];
  const colors = product.colors || [];
  const productId = product._id || product.id;

  const loadReviewsData = useCallback(async () => {
    if (!productId) return;

    // Fetch public approved reviews & aggregate summary
    const res = await reviewService.getProductReviews(productId);
    if (res.success) {
      setReviews(res.data || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    }

    // Fetch user-specific review state if logged in
    if (authService.isAuthenticated()) {
      const userRes = await reviewService.getMyReview(productId);
      if (userRes.success) {
        setIsVerifiedBuyer(userRes.isVerifiedBuyer);
        setMyReview(userRes.myReview);

        if (userRes.myReview) {
          setFormRating(userRes.myReview.rating);
          setFormTitle(userRes.myReview.title || '');
          setFormComment(userRes.myReview.comment || '');
        }
      }
    }
  }, [productId]);

  useEffect(() => {
    loadReviewsData();
  }, [loadReviewsData]);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 3000);
      return;
    }
    
    setSizeError(false);
    setIsAdding(true);
    
    const productWithSize = {
      ...product,
      size: selectedSize,
      quantity: quantity
    };
    
    setTimeout(() => {
      onAddToCart(productWithSize);
      setIsAdding(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1200);
    }, 300);
  };

  const handleWishlist = () => {
    onAddToWishlist(product);
  };

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

  const handleCancelForm = () => {
    setShowWriteForm(false);
    setIsEditing(false);
    setFormError('');
    setFormSuccess('');
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

    setSubmittingReview(false);

    if (res.success) {
      setFormSuccess(res.message || 'Review submitted successfully');
      setShowWriteForm(false);
      setIsEditing(false);
      await loadReviewsData();
    } else {
      setFormError(res.message || 'Failed to submit review');
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

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="product-detail-overlay" onClick={onClose}>
      <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="btn-close-modal" onClick={onClose} aria-label="Close product details">✕</button>
        
        <div className="product-detail-content">
          {/* Left - Image */}
          <div className="product-detail-left">
            {product.badge && (
              <div className={`product-badge-large badge-${product.badgeColor || 'primary'}`}>
                <span className="telemetry-label">{product.badge}</span>
              </div>
            )}
            <img src={product.image} alt={product.name} className="product-detail-image" />
          </div>

          {/* Right - Details */}
          <div className="product-detail-right">
            <div className="product-detail-header">
              <div>
                <span className="product-category telemetry-label">
                  {product.category === 'men' ? '👨 MEN\'S' : '👩 WOMEN\'S'}
                </span>
                <h1 className="headline-lg">{product.name}</h1>
                <p className="product-detail-price">
                  <span className="price-large">₹{Number(product.price || 0).toLocaleString()}</span>
                  {product.originalPrice && (
                    <>
                      <span className="original-price">₹{Number(product.originalPrice).toLocaleString()}</span>
                      <span className="discount-badge">{product.discount}% OFF</span>
                    </>
                  )}
                </p>
              </div>
              <button 
                className={`btn-wishlist ${isInWishlist ? 'active' : ''}`}
                onClick={handleWishlist}
                title={isInWishlist ? 'In wishlist' : 'Add to wishlist'}
              >
                ❤️
              </button>
            </div>

            {/* Rating Summary Header */}
            <div className="product-detail-rating">
              <span className="rating-stars-large">{renderStars(summary.averageRating)}</span>
              <span className="rating-text">
                {summary.averageRating.toFixed(1)} ({summary.reviewCount} {summary.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>

            <div className="product-detail-description">
              <h3 className="headline-md">Description</h3>
              <p className="body-lg">{product.description}</p>
            </div>

            {/* Specs */}
            <div className="product-detail-specs">
              <h3 className="headline-md">Technical Specifications</h3>
              <div className="specs-grid">
                <div className="spec-box">
                  <span className="telemetry-label">WEIGHT</span>
                  <span className="telemetry-metric">{specs.weight || 'N/A'}</span>
                </div>
                <div className="spec-box">
                  <span className="telemetry-label">DROP</span>
                  <span className="telemetry-metric">{specs.drop || 'N/A'}</span>
                </div>
                <div className="spec-box">
                  <span className="telemetry-label">ENERGY RETURN</span>
                  <span className="telemetry-metric">{specs.energy || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div className="product-features">
                <h3 className="headline-md">Key Features</h3>
                <ul className="features-list">
                  {features.map((feature, index) => (
                    <li key={index} className="body-md">
                      <span className="feature-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Size Selection */}
            <div className="size-selection">
              <h3 className="headline-md">Select Size (US)</h3>
              {sizeError && (
                <p className="size-error-message">
                  ⚠️ Please select a size before adding to cart
                </p>
              )}
              <div className="size-grid">
                {sizes.map((size) => (
                  <button
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'active' : ''} ${sizeError ? 'error' : ''}`}
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError(false);
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {colors.length > 0 && (
              <div className="color-selection">
                <h3 className="headline-md">Color</h3>
                <div className="product-colors">
                  {colors.map((color) => <span key={color} className="color-chip">{color}</span>)}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="quantity-section">
              <h3 className="headline-md">Quantity</h3>
              <div className="quantity-controls-large">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="qty-btn"
                >
                  −
                </button>
                <span className="qty-display">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="qty-btn"
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
              <span className="stock-info telemetry-label">
                {product.stock} UNITS IN STOCK
              </span>
            </div>

            {/* Add to Cart */}
            <button 
              className={`btn-add-to-cart-large ${showSuccess ? 'success' : ''}`}
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAdding || showSuccess}
            >
              {showSuccess ? (
                <span>✅ ADDED TO CART!</span>
              ) : isAdding ? (
                <>
                  <span>ADDING...</span>
                  <span className="btn-icon">⏳</span>
                </>
              ) : (
                <>
                  <span>ADD TO CART</span>
                  <span className="btn-icon">→</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ================= REVIEWS & RATINGS SECTION ================= */}
        <div className="product-reviews-section">
          <div className="reviews-header">
            <h2 className="headline-lg">Customer Reviews & Ratings</h2>
            <span className="verified-buyer-tag">✓ Verified Buyers System</span>
          </div>

          {/* Rating Summary Breakdown */}
          <div className="reviews-summary-container">
            <div className="summary-left">
              <div className="average-rating-num">{summary.averageRating.toFixed(1)}</div>
              <div className="average-rating-stars">{renderStars(summary.averageRating)}</div>
              <div className="total-reviews-count">Based on {summary.reviewCount} verified reviews</div>
            </div>

            <div className="summary-right-bars">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.distribution[star] || 0;
                const pct = summary.reviewCount > 0 ? (count / summary.reviewCount) * 100 : 0;
                return (
                  <div key={star} className="rating-bar-row">
                    <span className="bar-label">{star} ★</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="bar-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Review Actions Banner */}
          <div className="user-review-banner">
            {!authService.isAuthenticated() ? (
              <div className="review-notice-box notice-guest">
                <span>🔒 Please <strong>log in</strong> and purchase this product to share your verified review.</span>
              </div>
            ) : myReview ? (
              <div className="my-review-box">
                <div className="my-review-header">
                  <div className="my-review-title-area">
                    <h3>Your Review</h3>
                    <span className={`status-badge status-${myReview.status.toLowerCase()}`}>
                      {myReview.status === 'PENDING' ? '⏳ Awaiting Moderation' : myReview.status === 'APPROVED' ? '✅ Published' : '❌ Rejected'}
                    </span>
                  </div>
                  <div className="my-review-actions">
                    <button className="btn-edit-review" onClick={handleStartEdit}>Edit Review</button>
                    <button className="btn-delete-review" onClick={handleDeleteReview}>Delete</button>
                  </div>
                </div>
                <div className="my-review-content">
                  <div className="stars-row">{renderStars(myReview.rating)}</div>
                  {myReview.title && <h4 className="my-review-heading">{myReview.title}</h4>}
                  <p className="my-review-text">{myReview.comment}</p>
                </div>
              </div>
            ) : isVerifiedBuyer ? (
              !showWriteForm && (
                <div className="write-review-cta">
                  <div className="cta-info">
                    <h3>Purchased this product?</h3>
                    <p>Share your experience to help other runners make informed choices.</p>
                  </div>
                  <button className="btn-write-review" onClick={() => setShowWriteForm(true)}>
                    ✍️ Write a Review
                  </button>
                </div>
              )
            ) : (
              <div className="review-notice-box notice-nonbuyer">
                <span>🔒 <strong>Verified Buyer Only</strong>: Purchase this product to leave a review.</span>
              </div>
            )}
          </div>

          {/* Write / Edit Review Form */}
          {showWriteForm && (
            <form className="review-form-card" onSubmit={handleSubmitReview}>
              <h3>{isEditing ? 'Edit Your Review' : 'Write a Verified Review'}</h3>

              {formError && <div className="form-alert alert-error">⚠️ {formError}</div>}
              {formSuccess && <div className="form-alert alert-success">✅ {formSuccess}</div>}

              <div className="form-group">
                <label>Overall Rating *</label>
                <div className="star-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-pick-btn ${star <= formRating ? 'active' : ''}`}
                      onClick={() => setFormRating(star)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-label">{formRating} out of 5 Stars</span>
                </div>
              </div>

              <div className="form-group">
                <label>Review Title (Optional)</label>
                <input
                  type="text"
                  className="review-input"
                  placeholder="e.g. Extremely comfortable for long distance runs!"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Your Review *</label>
                <textarea
                  className="review-textarea"
                  rows="4"
                  placeholder="Tell us about fit, performance, durability, comfort..."
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  maxLength={1000}
                  required
                />
                <span className="char-count">{formComment.length} / 1000 characters</span>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-submit-review"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  className="btn-cancel-review"
                  onClick={handleCancelForm}
                  disabled={submittingReview}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Public Approved Reviews List */}
          <div className="reviews-list-container">
            <h3 className="reviews-list-title">Verified Customer Reviews</h3>

            {reviews.length === 0 ? (
              <div className="no-reviews-box">
                <p>No verified reviews have been published yet for this product.</p>
              </div>
            ) : (
              <div className="reviews-cards-grid">
                {reviews.map((rev) => (
                  <div key={rev._id} className="review-item-card">
                    <div className="review-card-header">
                      <div className="reviewer-meta">
                        <span className="reviewer-name">{rev.user?.name || 'Verified Customer'}</span>
                        {rev.isVerifiedPurchase && (
                          <span className="verified-badge">✓ Verified Purchase</span>
                        )}
                      </div>
                      <span className="review-date">
                        {new Date(rev.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="review-rating-stars">{renderStars(rev.rating)}</div>
                    {rev.title && <h4 className="review-card-title">{rev.title}</h4>}
                    <p className="review-card-comment">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;

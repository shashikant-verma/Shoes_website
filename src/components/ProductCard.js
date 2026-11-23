import React, { useState } from 'react';
import './ProductCard.css';

function ProductCard({ 
  product, 
  onProductClick, 
  index = 0, 
  isInWishlist = false, 
  onToggleWishlist, 
  onQuickView,
  onAddToCart
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedQuickSize, setSelectedQuickSize] = useState(null);

  if (!product) return null;

  const rating = Number(product.rating) || 0;
  const reviewCount = Number(product.reviewCount ?? product.reviews) || 0;
  const isOutOfStock = product.stock === 0;

  // Determine badge
  let badgeText = null;
  let badgeType = 'default';

  if (isOutOfStock) {
    badgeText = 'SOLD OUT';
    badgeType = 'soldout';
  } else if (product.discount && product.discount > 0 && product.originalPrice && product.originalPrice > product.price) {
    badgeText = `-${product.discount}%`;
    badgeType = 'sale';
  } else if (product.isNew) {
    badgeText = 'NEW';
    badgeType = 'new';
  } else if (product.badge) {
    badgeText = product.badge;
    badgeType = 'featured';
  }

  // Gallery image fallback for secondary hover preview if available
  const primaryImage = product.image;
  const secondaryImage = (product.images && product.images.length > 1 && product.images[1] !== product.image)
    ? product.images[1]
    : null;

  const displayImage = (isHovered && secondaryImage) ? secondaryImage : primaryImage;

  const handleCardClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  const handleQuickAdd = (size, e) => {
    e.stopPropagation();
    setSelectedQuickSize(size);
    if (onAddToCart) {
      onAddToCart({
        ...product,
        size,
        quantity: 1
      });
    }
  };

  return (
    <article
      className={`product-card ${isOutOfStock ? 'is-out-of-stock' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setSelectedQuickSize(null); }}
      tabIndex="0"
      role="button"
      aria-label={`View ${product.name}, price ₹${Number(product.price || 0).toLocaleString()}`}
    >
      {/* Visual Badge */}
      {badgeText && (
        <div className={`card-badge badge-${badgeType}`}>
          <span>{badgeText}</span>
        </div>
      )}

      {/* Floating Wishlist Button */}
      <button 
        type="button"
        className={`card-wishlist-btn ${isInWishlist ? 'active' : ''}`} 
        title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        aria-label={isInWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleWishlist) onToggleWishlist(product, e);
        }}
      >
        <span className="heart-icon" aria-hidden="true">
          {isInWishlist ? '♥' : '♡'}
        </span>
      </button>

      {/* 4:5 Aspect Ratio Product Image Container */}
      <div className="card-image-wrap">
        <img
          src={displayImage}
          alt={product.name}
          className="card-image"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            // Fallback gracefully to primary if secondary fails
            if (e.target.src !== primaryImage) {
              e.target.src = primaryImage;
            }
          }}
        />

        {/* Floating Quick View Overlay */}
        <div className="card-overlay">
          {onQuickView && (
            <button
              type="button"
              className="card-quick-view-btn"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              aria-label={`Quick view ${product.name}`}
            >
              <span>QUICK VIEW</span>
            </button>
          )}

          {/* Quick Size Bar on Hover (when in stock and sizes exist) */}
          {!isOutOfStock && product.sizes && product.sizes.length > 0 && onAddToCart && (
            <div className="quick-size-bar" onClick={(e) => e.stopPropagation()}>
              <span className="quick-size-label">QUICK ADD:</span>
              <div className="quick-size-list">
                {product.sizes.slice(0, 6).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`quick-size-btn ${selectedQuickSize === sz ? 'added' : ''}`}
                    onClick={(e) => handleQuickAdd(sz, e)}
                    title={`Add size ${sz} to cart`}
                  >
                    {sz.replace(/UK\s*/i, '')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="card-info">
        <div className="card-category-row">
          <span className="card-category">
            {product.productType || product.category?.toUpperCase() || 'FOOTWEAR'}
          </span>
          {product.specifications?.drop && (
            <span className="card-drop-tag">
              {product.specifications.drop} DROP
            </span>
          )}
        </div>

        <h3 className="card-title" title={product.name}>
          {product.name}
        </h3>

        {/* Rating Row */}
        <div className="card-rating-row" aria-label={`${rating} out of 5 stars with ${reviewCount} reviews`}>
          <span className="rating-stars" aria-hidden="true">
            {'★'.repeat(Math.round(rating))}{'☆'.repeat(Math.max(0, 5 - Math.round(rating)))}
          </span>
          <span className="rating-score">{rating > 0 ? rating.toFixed(1) : ''}</span>
          <span className="review-count">({reviewCount})</span>
        </div>

        {/* Price & Stock Row */}
        <div className="card-price-row">
          <div className="card-prices">
            <span className="price-current">
              ₹{Number(product.price || 0).toLocaleString()}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="price-original">
                ₹{Number(product.originalPrice).toLocaleString()}
              </span>
            )}
          </div>

          <span className={`stock-status ${isOutOfStock ? 'stock-out' : 'stock-in'}`}>
            {isOutOfStock ? 'SOLD OUT' : 'IN STOCK'}
          </span>
        </div>
      </div>
    </article>
  );
}

export default React.memo(ProductCard);

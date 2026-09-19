import React from 'react';

function ProductCard({ product, onProductClick, index = 0, isInWishlist = false, onToggleWishlist }) {
  const rating = Number(product.rating) || 0;
  const reviewCount = Number(product.reviews ?? product.reviewCount) || 0;
  const badge = product.badge || (product.stock === 0 ? 'SOLD OUT' : 'NEW');

  return (
    <article
      className="product-card glass-panel fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => onProductClick(product)}
      tabIndex="0"
      role="button"
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onProductClick(product);
        }
      }}
      aria-label={`View ${product.name}`}
    >
      <div className={`product-badge badge-${product.badgeColor || 'primary'}`}>
        <span className="telemetry-label">{badge}</span>
      </div>

      {/* Wishlist Button */}
      <button 
        className={`wishlist-btn-card ${isInWishlist ? 'active' : ''}`} 
        title="Add to Wishlist"
        onClick={(e) => onToggleWishlist && onToggleWishlist(product, e)}
        style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px', 
          zIndex: 10,
          background: 'rgba(255,255,255,0.8)',
          border: 'none',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isInWishlist ? '#e74c3c' : '#333',
          fontSize: '20px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}
        aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        {isInWishlist ? '♥' : '♡'}
      </button>

      <div className="product-image-container">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        <div className="product-overlay">
          <span className="quick-view-btn">Quick View</span>
        </div>
      </div>

      <div className="product-info">
        <span className="product-category">{product.category?.toUpperCase()}</span>
        <h3 className="product-name headline-md">{product.name}</h3>
        <p className="product-description">
          {product.description || 'Thoughtfully designed footwear for everyday movement and style.'}
        </p>

        <div className="product-rating" aria-label={`${rating} out of 5 stars, ${reviewCount} reviews`}>
          <span className="rating-stars" aria-hidden="true">
            {'★'.repeat(Math.floor(rating))}{'☆'.repeat(Math.max(0, 5 - Math.floor(rating)))}
          </span>
          <span className="rating-value telemetry-label">{reviewCount} reviews</span>
        </div>

        <div className="product-footer">
          <div className="product-price">
            <span className="telemetry-metric price-amount">₹{Number(product.price || 0).toLocaleString()}</span>
            {product.originalPrice && (
              <span className="original-price">₹{Number(product.originalPrice).toLocaleString()}</span>
            )}
            <span className="telemetry-label stock-info">
              {product.stock > 0 ? `${product.stock} IN STOCK` : 'SOLD OUT'}
            </span>
          </div>

          <span
            className="btn-view-details"
          >
            <span className="telemetry-label">VIEW</span>
            <span className="btn-icon" aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;

import React, { useState } from 'react';
import './QuickViewModal.css';

function QuickViewModal({ product, onClose, onAddToCart, onAddToWishlist, isInWishlist, onViewFullDetails }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const sizes = product.sizes || ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'];
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 3000);
      return;
    }

    onAddToCart({
      ...product,
      size: selectedSize,
      quantity
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="quick-view-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">×</button>

        <div className="quick-view-grid">
          {/* Left: Product Image */}
          <div className="quick-view-image-wrap">
            <img src={product.image} alt={product.name} className="quick-view-img" />
            <span className={`stock-tag ${isOutOfStock ? 'tag-soldout' : 'tag-instock'}`}>
              {isOutOfStock ? 'SOLD OUT' : `${product.stock || 'In'} STOCK`}
            </span>
          </div>

          {/* Right: Info & Controls */}
          <div className="quick-view-info">
            <span className="product-category">{product.category?.toUpperCase()}</span>
            <h2 className="product-title headline-md">{product.name}</h2>

            <div className="quick-view-rating">
              <span className="rating-stars">
                {'★'.repeat(Math.floor(product.rating || 5))}
              </span>
              <span className="review-count">({product.reviews || product.reviewCount || 0} reviews)</span>
            </div>

            <div className="price-container">
              <span className="current-price">₹{Number(product.price || 0).toLocaleString()}</span>
              {product.originalPrice && (
                <span className="original-price">₹{Number(product.originalPrice).toLocaleString()}</span>
              )}
            </div>

            <p className="product-desc-short">
              {product.description || 'Thoughtfully designed footwear engineered for performance and comfort.'}
            </p>

            {/* Size Selector */}
            <div className="size-section">
              <div className="section-label-row">
                <span className="field-label">SELECT SIZE</span>
                {sizeError && <span className="size-error-text">Please select a size</span>}
              </div>
              <div className="size-buttons-grid">
                {sizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => { setSelectedSize(size); setSizeError(false); }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="quantity-section">
              <span className="field-label">QUANTITY</span>
              <div className="quantity-controls">
                <button 
                  type="button" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="qty-btn"
                >-</button>
                <span className="qty-value">{quantity}</span>
                <button 
                  type="button" 
                  onClick={() => setQuantity(quantity + 1)}
                  className="qty-btn"
                >+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="quick-view-actions">
              <button
                type="button"
                className={`btn-add-cart ${added ? 'added' : ''}`}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {added ? 'ADDED TO CART ✓' : (isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART')}
              </button>

              <button
                type="button"
                className={`btn-wishlist-quick ${isInWishlist ? 'active' : ''}`}
                onClick={() => onAddToWishlist(product)}
                title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                {isInWishlist ? '♥' : '♡'}
              </button>
            </div>

            <button
              type="button"
              className="view-full-details-link"
              onClick={() => {
                onClose();
                onViewFullDetails(product);
              }}
            >
              View Full Product Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickViewModal;

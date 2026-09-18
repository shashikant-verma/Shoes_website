import React, { useState } from 'react';
import './ProductDetail.css';

function ProductDetail({ product, onClose, onAddToCart, onAddToWishlist, isInWishlist }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const specs = product.specs || {};
  const features = product.features || [];

  const sizes = ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'];

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    
    const productWithSize = {
      ...product,
      size: selectedSize,
      quantity: quantity
    };
    
    onAddToCart(productWithSize);
    onClose();
  };

  const handleWishlist = () => {
    if (isInWishlist) {
      alert('Already in wishlist!');
    } else {
      onAddToWishlist(product);
    }
  };

  return (
    <div className="product-detail-overlay" onClick={onClose}>
      <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="btn-close-modal" onClick={onClose} aria-label="Close product details">✕</button>
        
        <div className="product-detail-content">
          {/* Left - Image */}
          <div className="product-detail-left">
            <div className={`product-badge-large badge-${product.badgeColor}`}>
              <span className="telemetry-label">{product.badge}</span>
            </div>
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
                  <span className="price-large">${product.price.toFixed(2)}</span>
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

            {/* Rating */}
            <div className="product-detail-rating">
              <span className="rating-stars-large">{'⭐'.repeat(Math.floor(product.rating))}</span>
              <span className="rating-text">{product.rating} ({product.reviews} reviews)</span>
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

            {/* Size Selection */}
            <div className="size-selection">
              <h3 className="headline-md">Select Size (US)</h3>
              <div className="size-grid">
                {sizes.map((size) => (
                  <button
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

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
              className="btn-add-to-cart-large"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <span>ADD TO CART</span>
              <span className="btn-icon">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;

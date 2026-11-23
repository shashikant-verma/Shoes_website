import React, { useState } from 'react';
import './Wishlist.css';

function Wishlist({ wishlist = [], onRemoveFromWishlist, onProductClick, onAddToCart }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-container">
          <div className="wishlist-empty-card">
            <span className="empty-heart-icon">🖤</span>
            <h2 className="empty-title">YOUR WISHLIST IS EMPTY</h2>
            <p className="empty-sub">
              Curate your personal SoleVibe footwear roster. Tap the heart icon on any pair to save it for future runs and drops.
            </p>
            <a href="/" className="btn-primary btn-explore-wishlist">
              EXPLORE FOOTWEAR
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleMoveToCart = (product) => {
    if (product.stock === 0) return;
    const defaultSize = (product.sizes && product.sizes.length > 0) ? product.sizes[0] : '8';
    if (onAddToCart) {
      onAddToCart({
        ...product,
        size: defaultSize.toString().replace(/UK\s*/i, ''),
        quantity: 1
      });
    }
    if (onRemoveFromWishlist) {
      onRemoveFromWishlist(product.id || product._id);
    }
  };

  const handleClearWishlist = () => {
    wishlist.forEach(item => onRemoveFromWishlist && onRemoveFromWishlist(item.id || item._id));
    setShowClearConfirm(false);
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        {/* Wishlist Header */}
        <div className="wishlist-header-row">
          <div>
            <div className="telemetry-badge">
              <span className="status-dot pulse-glow"></span>
              <span className="telemetry-label">SAVED ATHLETE ROSTER</span>
            </div>
            <h1 className="wishlist-title">SAVED FOOTWEAR ({wishlist.length})</h1>
            <p className="wishlist-subtitle">Your curated selection of personal favorites and future drops.</p>
          </div>
          
          <button 
            type="button" 
            className="btn-clear-wishlist"
            onClick={() => setShowClearConfirm(true)}
          >
            Clear All Saved
          </button>
        </div>

        {/* 4-Column Product Grid */}
        <div className="wishlist-grid">
          {wishlist.map((product, index) => {
            const isOOS = Number(product.stock) === 0;
            const productId = product.id || product._id || index;
            const weightSpec = product.specifications?.weight || product.specs?.weight;
            const dropSpec = product.specifications?.drop || product.specs?.drop;

            return (
              <div
                key={productId}
                className="wishlist-card"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Heart Remove Action */}
                <button
                  type="button"
                  className="btn-remove-wishlist"
                  onClick={() => onRemoveFromWishlist && onRemoveFromWishlist(product.id || product._id)}
                  title="Remove from wishlist"
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF4D2E" stroke="#FF4D2E" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                {/* Footwear Thumbnail */}
                <div 
                  className="wishlist-image-container"
                  onClick={() => onProductClick && onProductClick(product)}
                  role="button"
                  tabIndex="0"
                >
                  <img src={product.image} alt={product.name} className="wishlist-image" />
                  {isOOS && (
                    <span className="wishlist-stock-badge oos-badge">
                      SOLD OUT
                    </span>
                  )}
                  {product.category && (
                    <span className="wishlist-category-tag">
                      {product.category.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Details & Action */}
                <div className="wishlist-info">
                  <h3 
                    className="wishlist-product-name"
                    onClick={() => onProductClick && onProductClick(product)}
                  >
                    {product.name}
                  </h3>
                  
                  {/* Genuine Specs Only */}
                  {(weightSpec || dropSpec) && (
                    <div className="wishlist-specs-strip">
                      {weightSpec && <span className="spec-chip">WT: {weightSpec}</span>}
                      {dropSpec && <span className="spec-chip">DROP: {dropSpec}</span>}
                    </div>
                  )}

                  <div className="wishlist-footer">
                    <div className="price-stack">
                      <span className="current-price">₹{Number(product.price || 0).toLocaleString()}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="original-price">₹{Number(product.originalPrice).toLocaleString()}</span>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      className="btn-move-to-cart"
                      onClick={() => handleMoveToCart(product)}
                      disabled={isOOS}
                    >
                      <span>{isOOS ? 'SOLD OUT' : 'MOVE TO BAG'}</span>
                      {!isOOS && <span className="btn-icon">→</span>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clear Wishlist Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-backdrop fade-in" onClick={() => setShowClearConfirm(false)}>
          <div className="clear-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Clear All Saved Shoes?</h3>
            <p>Are you sure you want to remove all {wishlist.length} footwear items from your saved roster?</p>
            <div className="modal-actions-row">
              <button 
                type="button"
                className="btn-modal-cancel"
                onClick={() => setShowClearConfirm(false)}
              >
                Keep Saved
              </button>
              <button 
                type="button"
                className="btn-modal-danger"
                onClick={handleClearWishlist}
              >
                Clear Entire List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wishlist;

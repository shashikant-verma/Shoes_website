import React from 'react';
import './Wishlist.css';

function Wishlist({ wishlist, onRemoveFromWishlist, onProductClick, onAddToCart }) {
  if (wishlist.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-container">
          <div className="wishlist-empty">
            <div className="empty-icon">❤️</div>
            <h2 className="headline-lg">Your Wishlist is Empty</h2>
            <p className="body-lg">Save your favorite shoes here for later!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        <div className="wishlist-header">
          <div className="telemetry-badge">
            <span className="status-dot pulse-glow"></span>
            <span className="telemetry-label">FAVORITES</span>
          </div>
          <h1 className="headline-lg">Your Wishlist ({wishlist.length})</h1>
          <p className="body-md">Keep track of products you love</p>
        </div>

        <div className="wishlist-grid">
          {wishlist.map((product, index) => (
            <div
              key={product.id}
              className="wishlist-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <button
                className="btn-remove-wishlist"
                onClick={() => onRemoveFromWishlist(product.id)}
                title="Remove from wishlist"
              >
                ❤️
              </button>

              <div 
                className="wishlist-image-container"
                onClick={() => onProductClick(product)}
              >
                <img src={product.image} alt={product.name} className="wishlist-image" />
              </div>

              <div className="wishlist-info">
                <h3 className="headline-md">{product.name}</h3>
                
                <div className="wishlist-rating">
                  <span className="rating-stars">{'⭐'.repeat(Math.floor(product.rating))}</span>
                  <span className="rating-value telemetry-label">{product.rating}</span>
                </div>

                <div className="wishlist-specs">
                  <span className="telemetry-label">{product.specs.weight}</span>
                  <span className="spec-dot">•</span>
                  <span className="telemetry-label">{product.specs.energy}</span>
                </div>

                <div className="wishlist-footer">
                  <span className="wishlist-price">${product.price.toFixed(2)}</span>
                  <button
                    className="btn-add-from-wishlist"
                    onClick={() => {
                      onProductClick(product);
                    }}
                  >
                    <span className="telemetry-label">VIEW</span>
                    <span className="btn-icon">→</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Wishlist;

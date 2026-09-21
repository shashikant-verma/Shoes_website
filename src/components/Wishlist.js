import React, { useState } from 'react';
import './Wishlist.css';

function Wishlist({ wishlist, onRemoveFromWishlist, onProductClick, onAddToCart }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

  const handleMoveToCart = (product) => {
    if (product.stock === 0) return;
    const defaultSize = (product.sizes && product.sizes.length > 0) ? product.sizes[0] : 'UK 8';
    onAddToCart({
      ...product,
      size: defaultSize,
      quantity: 1
    });
    onRemoveFromWishlist(product.id || product._id);
  };

  const handleClearWishlist = () => {
    wishlist.forEach(item => onRemoveFromWishlist(item.id || item._id));
    setShowClearConfirm(false);
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        <div className="wishlist-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="telemetry-badge">
              <span className="status-dot pulse-glow"></span>
              <span className="telemetry-label">FAVORITES</span>
            </div>
            <h1 className="headline-lg">Your Wishlist ({wishlist.length})</h1>
            <p className="body-md">Keep track of products you love</p>
          </div>
          
          <button 
            type="button" 
            onClick={() => setShowClearConfirm(true)}
            style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
          >
            Clear Wishlist
          </button>
        </div>

        <div className="wishlist-grid">
          {wishlist.map((product, index) => {
            const isOOS = product.stock === 0;
            return (
              <div
                key={product.id || product._id || index}
                className="wishlist-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <button
                  className="btn-remove-wishlist"
                  onClick={() => onRemoveFromWishlist(product.id || product._id)}
                  title="Remove from wishlist"
                >
                  ❤️
                </button>

                <div 
                  className="wishlist-image-container"
                  onClick={() => onProductClick(product)}
                >
                  <img src={product.image} alt={product.name} className="wishlist-image" />
                  {isOOS && (
                    <span className="stock-tag tag-soldout" style={{ position: 'absolute', top: '10px', left: '10px', background: '#fef2f2', color: '#b91c1c', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                      SOLD OUT
                    </span>
                  )}
                </div>

                <div className="wishlist-info">
                  <h3 className="headline-md">{product.name}</h3>
                  
                  <div className="wishlist-rating">
                    <span className="rating-stars">{'⭐'.repeat(Math.floor(product.rating || 5))}</span>
                    <span className="rating-value telemetry-label">{product.rating || 5}</span>
                  </div>

                  <div className="wishlist-specs">
                    <span className="telemetry-label">{product.specifications?.weight || product.specs?.weight || '290g'}</span>
                    <span className="spec-dot">•</span>
                    <span className="telemetry-label">{product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}</span>
                  </div>

                  <div className="wishlist-footer" style={{ gap: '0.5rem' }}>
                    <span className="wishlist-price">₹{Number(product.price || 0).toLocaleString()}</span>
                    
                    <button
                      type="button"
                      className="btn-add-from-wishlist"
                      onClick={() => handleMoveToCart(product)}
                      disabled={isOOS}
                      style={{ opacity: isOOS ? 0.5 : 1, cursor: isOOS ? 'not-allowed' : 'pointer' }}
                    >
                      <span className="telemetry-label">{isOOS ? 'OOS' : 'MOVE TO CART'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clear Wishlist Modal */}
      {showClearConfirm && (
        <div className="modal-backdrop fade-in" onClick={() => setShowClearConfirm(false)}>
          <div className="glass-panel" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#111827' }}>Clear Entire Wishlist?</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Are you sure you want to remove all saved items from your wishlist?</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowClearConfirm(false)}
                style={{ padding: '0.6rem 1.2rem', border: '1px solid #d1d5db', background: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleClearWishlist}
                style={{ padding: '0.6rem 1.2rem', border: 'none', background: '#ef4444', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wishlist;

import React from 'react';
import './ProductList.css';

function ProductList({ products, onEdit, onDelete, isAdmin, onAddToCart }) {
  if (products.length === 0) {
    return (
      <div className="empty-products">
        <p>📦 No products available</p>
        {isAdmin && <p className="hint">Add your first product to get started</p>}
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div key={product._id} className="product-card">
          <div className="product-image">
            <img src={product.image} alt={product.name} />
            {product.stock === 0 && <div className="out-of-stock-badge">Out of Stock</div>}
            {product.status !== 'active' && (
              <div className="status-badge">{product.status}</div>
            )}
            {product.featured && <div className="featured-badge">⭐ Featured</div>}
          </div>
          
          <div className="product-info">
            <div className="product-badges">
              {product.badge && (
                <span className={`product-badge badge-${product.badgeColor}`}>
                  {product.badge}
                </span>
              )}
            </div>
            <h3 className="product-name">{product.name}</h3>
            <p className="product-description">{product.description}</p>
            
            {/* Specifications */}
            {product.specifications && (
              <div className="product-specs">
                <div className="spec-item">
                  <span className="spec-label">Weight:</span>
                  <span className="spec-value">{product.specifications.weight || 'N/A'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Drop:</span>
                  <span className="spec-value">{product.specifications.drop || 'N/A'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Energy:</span>
                  <span className="spec-value">{product.specifications.energy || 'N/A'}</span>
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="product-rating">
              <span className="rating-stars">
                {'⭐'.repeat(Math.floor(product.rating || 0))}
              </span>
              <span className="rating-text">
                {product.rating || 0} ({product.reviewCount || 0} reviews)
              </span>
            </div>
            
            <div className="product-meta">
              <span className="product-category">
                {product.category === 'men' ? '👨 Men' : '👩 Women'}
              </span>
              <span className="product-stock">
                📦 {product.stock} in stock
              </span>
              <span className={`product-status status-${product.status}`}>
                {product.status?.toUpperCase() || 'ACTIVE'}
              </span>
            </div>

            <div className="product-footer">
              <span className="product-price">${product.price?.toFixed(2)}</span>
              
              <div className="product-actions">
                {isAdmin ? (
                  <>
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => onEdit(product)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => onDelete(product._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary btn-add-cart"
                    onClick={() => onAddToCart(product)}
                    disabled={product.stock === 0 || product.status !== 'active'}
                  >
                    {product.stock === 0 ? 'Out of Stock' : 
                     product.status !== 'active' ? 'Unavailable' : 
                     '🛒 Add to Cart'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductList;

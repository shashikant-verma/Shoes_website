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
        <div key={product.id} className="product-card">
          <div className="product-image">
            <img src={product.image} alt={product.name} />
            {product.stock === 0 && <div className="out-of-stock-badge">Out of Stock</div>}
          </div>
          
          <div className="product-info">
            <span className="product-brand">{product.brand}</span>
            <h3 className="product-name">{product.name}</h3>
            <p className="product-description">{product.description}</p>
            
            <div className="product-meta">
              <span className="product-category">
                {product.category === 'men' ? '👨 Men' : '👩 Women'}
              </span>
              <span className="product-stock">
                📦 {product.stock} in stock
              </span>
            </div>

            <div className="product-footer">
              <span className="product-price">${product.price.toFixed(2)}</span>
              
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
                      onClick={() => onDelete(product.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary btn-add-cart"
                    onClick={() => onAddToCart(product)}
                    disabled={product.stock === 0}
                  >
                    {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
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

import React from 'react';

function ProductSkeleton() {
  return (
    <div className="product-card product-skeleton" aria-hidden="true">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-short"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line skeleton-price"></div>
      </div>
    </div>
  );
}

export default ProductSkeleton;

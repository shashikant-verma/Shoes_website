import React from 'react';
import './ProductSkeleton.css';

function ProductSkeleton() {
  return (
    <div className="product-skeleton" aria-hidden="true">
      <div className="skeleton-image-wrap skeleton-shimmer" />
      <div className="skeleton-body">
        <div className="skeleton-line category skeleton-shimmer" />
        <div className="skeleton-line title skeleton-shimmer" />
        <div className="skeleton-line title-sub skeleton-shimmer" />
        <div className="skeleton-line rating skeleton-shimmer" />
        <div className="skeleton-footer">
          <div className="skeleton-line price skeleton-shimmer" />
          <div className="skeleton-line stock skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

export default React.memo(ProductSkeleton);

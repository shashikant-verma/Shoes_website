import React from 'react';
import ProductCard from './ProductCard';
import './RecentlyViewed.css';

export const recordRecentlyViewed = (product) => {
  if (!product || (!product.id && !product._id)) return;
  const productId = product.id || product._id;
  const KEY = 'solevibe_recently_viewed';
  
  try {
    const existingStr = localStorage.getItem(KEY);
    let items = existingStr ? JSON.parse(existingStr) : [];
    
    // Remove if already present
    items = items.filter(item => (item.id || item._id) !== productId);
    
    // Unshift product at start
    items.unshift(product);
    
    // Limit to 6 items max
    if (items.length > 6) {
      items = items.slice(0, 6);
    }
    
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to record recently viewed product', err);
  }
};

export const getRecentlyViewed = () => {
  const KEY = 'solevibe_recently_viewed';
  try {
    const existingStr = localStorage.getItem(KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch {
    return [];
  }
};

function RecentlyViewed({ onProductClick, wishlist = [], onToggleWishlist, currentProductId }) {
  const allItems = getRecentlyViewed();
  // Filter out current product if viewing ProductDetail
  const items = currentProductId 
    ? allItems.filter(item => (item.id || item._id) !== currentProductId)
    : allItems;

  if (!items || items.length === 0) return null;

  return (
    <section className="recently-viewed-section">
      <div className="section-header-simple">
        <h3 className="headline-md">RECENTLY VIEWED SHOES</h3>
        <span className="section-subtitle">Pick up right where you left off</span>
      </div>

      <div className="recently-viewed-grid">
        {items.map((item, index) => {
          const itemId = item.id || item._id;
          const isInWishlist = wishlist.some(w => (w.id || w._id) === itemId);
          return (
            <ProductCard 
              key={itemId || index}
              product={item}
              onProductClick={onProductClick}
              index={index}
              isInWishlist={isInWishlist}
              onToggleWishlist={onToggleWishlist}
            />
          );
        })}
      </div>
    </section>
  );
}

export default RecentlyViewed;

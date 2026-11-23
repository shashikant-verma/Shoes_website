import React from 'react';
import CollectionPage from './CollectionPage';

function ProductShowcase({
  onAddToCart,
  categoryFilter = 'all',
  onProductClick,
  onQuickView,
  wishlist = [],
  onToggleWishlist,
  searchQuery = '',
  onPageChange
}) {
  const title = categoryFilter === 'ozark' ? 'OZARK' :
    categoryFilter === 'accessories' ? 'ACCESSORIES' : 'PRODUCTS';
    
  const subtitle = categoryFilter === 'ozark'
    ? 'Rugged outdoor and adventure footwear engineered for all terrain and challenging conditions.'
    : categoryFilter === 'accessories'
    ? 'Footwear accessories, engineered socks, carbon insoles, and specialized shoe care products.'
    : 'Explore all footwear products across the SoleVibe catalog.';

  return (
    <CollectionPage
      title={title}
      subtitle={subtitle}
      categoryFilter={categoryFilter}
      onAddToCart={onAddToCart}
      onProductClick={onProductClick}
      onQuickView={onQuickView}
      wishlist={wishlist}
      onToggleWishlist={onToggleWishlist}
      searchQuery={searchQuery}
      onPageChange={onPageChange}
    />
  );
}

export default React.memo(ProductShowcase);

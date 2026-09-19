import React, { useState, useEffect } from 'react';
import './CollectionPage.css';
import productService from '../services/productService';

function CollectionPage({ 
  title, 
  subtitle, 
  categoryFilter, 
  saleMode = false,
  heroImage,
  onAddToCart, 
  onProductClick 
}) {
  const initialSubcategory = categoryFilter === 'racing' ? 'road-racing' :
    ['running', 'training', 'trail', 'lifestyle'].includes(categoryFilter) ? categoryFilter : 'all';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Hero background images with models and shoes in sharp focus
  const categoryHeroImages = {
    men: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1600&q=85', // Man tying athletic performance running shoe, shoes in sharp focus
    women: 'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=1600&q=85', // Woman runner with footwear in sharp focus
    accessories: 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=1600&q=85', // Footwear accessories, care, and essentials
    ozark: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1600&q=85', // Rugged outdoor trail & hiking shoes in focus
    running: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1600&q=85',
    training: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=85',
    trail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=85',
    racing: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=1600&q=85',
    'new-arrivals': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600&q=85',
    sale: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1600&q=85',
    all: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=85'
  };

  const currentHeroImage = heroImage || categoryHeroImages[categoryFilter] || categoryHeroImages[title?.toLowerCase()] || categoryHeroImages.men;

  // Filter and sort states
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
  const [sortBy, setSortBy] = useState('featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    availability: [],
    priceRange: [0, 20000],
    size: [],
    category: [],
    color: []
  });

  // Dynamic subcategories for navigation
  const getSubcategories = () => {
    if (categoryFilter === 'accessories') {
      return [
        { id: 'all', name: 'ALL' },
        { id: 'socks', name: 'SOCKS' },
        { id: 'insoles', name: 'INSOLES' },
        { id: 'care', name: 'SHOE CARE' },
        { id: 'laces', name: 'LACES' }
      ];
    }
    if (categoryFilter === 'ozark') {
      return [
        { id: 'all', name: 'ALL' },
        { id: 'trail', name: 'TRAIL RUNNING' },
        { id: 'hiking', name: 'HIKING & TREK' },
        { id: 'all-weather', name: 'ALL WEATHER' },
        { id: 'rugged', name: 'RUGGED BOOTS' }
      ];
    }
    return [
      { id: 'all', name: 'ALL' },
      { id: 'running', name: 'RUNNING' },
      { id: 'road-racing', name: 'ROAD RACING' },
      { id: 'trail', name: 'TRAIL' },
      { id: 'training', name: 'TRAINING' },
      { id: 'lifestyle', name: 'LIFESTYLE' }
    ];
  };

  const subcategories = getSubcategories();

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A-Z' }
  ];

  // Load products from API
  useEffect(() => {
    loadProducts();
    setSelectedSubcategory(initialSubcategory);
  }, [categoryFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const isGender = ['men', 'women', 'unisex'].includes(categoryFilter);
      const isSpecialCollection = ['accessories', 'ozark'].includes(categoryFilter);

      const params = {
        status: 'active',
        limit: 50
      };

      if (isGender) {
        params.category = categoryFilter;
      } else if (isSpecialCollection) {
        params.collectionName = categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1);
      }

      const result = await productService.getProducts(params);
      
      if (result.success) {
        const transformedProducts = result.data.data.map(product => ({
          id: product._id,
          name: product.name,
          image: product.image,
          category: product.category,
          brand: product.brand,
          productType: product.productType,
          price: product.price,
          originalPrice: product.originalPrice,
          discount: product.discount,
          images: product.images || [product.image],
          sizes: product.sizes || [],
          colors: product.colors || [],
          specs: {
            weight: product.specifications?.weight || 'N/A',
            drop: product.specifications?.drop || 'N/A',
            energy: product.specifications?.energy || 'N/A'
          },
          stock: product.stock || 0,
          description: product.description,
          features: product.features || [],
          badge: product.badge || 'NEW',
          badgeColor: product.badgeColor || 'primary',
          rating: product.rating || 0,
          reviews: product.reviewCount || 0,
          featured: product.featured || false,
          isNew: product.isNew || false,
          onSale: product.onSale || false
        }));
        setProducts(transformedProducts);
      } else {
        setError(result.message);
        setProducts([]);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  // Filter and sort products
  const getFilteredAndSortedProducts = () => {
    let filtered = [...products];

    // Filter by subcategory (running, trail, etc.)
    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(p => {
        const productName = p.name.toLowerCase();
        const productDesc = p.description.toLowerCase();
        
        switch (selectedSubcategory) {
          case 'running':
            return productName.includes('run') || productDesc.includes('run') || 
                   productName.includes('sprint') || productDesc.includes('sprint');
          case 'road-racing':
            return productName.includes('racing') || productDesc.includes('racing') || 
                   productName.includes('race') || productDesc.includes('race') ||
                   productName.includes('carbon') || productDesc.includes('carbon');
          case 'trail':
            return productName.includes('trail') || productDesc.includes('trail') ||
                   productName.includes('thunder') || productDesc.includes('thunder');
          case 'training':
            return productName.includes('training') || productDesc.includes('training') ||
                   productName.includes('train') || productDesc.includes('train');
          case 'lifestyle':
            return productName.includes('lifestyle') || productDesc.includes('lifestyle') ||
                   productName.includes('casual') || productDesc.includes('casual');
          case 'socks':
            return productName.includes('sock') || productDesc.includes('sock');
          case 'insoles':
            return productName.includes('insole') || productDesc.includes('insole');
          case 'care':
            return productName.includes('care') || productName.includes('clean') || productDesc.includes('care');
          case 'laces':
            return productName.includes('lace') || productDesc.includes('lace');
          case 'hiking':
            return productName.includes('hike') || productDesc.includes('hike') || productName.includes('boot');
          case 'all-weather':
            return productName.includes('shield') || productDesc.includes('water') || productDesc.includes('weather');
          case 'rugged':
            return productName.includes('boot') || productDesc.includes('rugged') || productDesc.includes('durable');
          default:
            return true;
        }
      });
    }

    // Filter by availability
    if (filters.availability.length > 0) {
      if (filters.availability.includes('in-stock')) {
        filtered = filtered.filter(p => p.stock > 0);
      }
      if (filters.availability.includes('out-of-stock')) {
        filtered = filtered.filter(p => p.stock === 0);
      }
    }

    // Filter by price range
    filtered = filtered.filter(p => 
      p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // For sale mode, prioritize sale items
    if (saleMode) {
      filtered = filtered.filter(p => p.onSale || p.originalPrice || p.discount);
    }

    if (categoryFilter === 'new-arrivals') {
      filtered = filtered.filter(p => p.isNew);
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default: // featured
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return filtered;
  };

  const filteredProducts = getFilteredAndSortedProducts();

  const handleFilterChange = (filterType, value, checked) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked 
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      availability: [],
      priceRange: [0, 20000],
      size: [],
      category: [],
      color: []
    });
    setSelectedSubcategory('all');
    setSortBy('featured');
  };

  if (loading) {
    return (
      <div className="collection-page">
        <div className="collection-container">
          <div className="loading-state">
            <div className="loading-spinner">⚡</div>
            <h2>Loading {title}...</h2>
            <p>Fetching the latest footwear from our collection</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collection-page">
        <div className="collection-container">
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h2>Connection Error</h2>
            <p>{error}</p>
            <button className="btn-retry" onClick={loadProducts}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="collection-page">
      {/* Collection Header with Photographic Background */}
      <div className={`collection-header ${currentHeroImage ? 'has-hero-bg' : ''}`}>
        {currentHeroImage && (
          <div className="collection-hero-bg-layer">
            <img 
              src={currentHeroImage} 
              alt={`${title} Footwear Focus`} 
              className="collection-hero-bg-img" 
            />
            <div className="collection-hero-overlay"></div>
          </div>
        )}
        <div className="collection-container relative-z">
          <div className="collection-hero">
            <span className="collection-badge-tag">SOLEVIBE EDIT</span>
            <h1 className="collection-title">{title}</h1>
            <p className="collection-subtitle">{subtitle}</p>
          </div>
          
          {/* Category Navigation */}
          <div className="category-navigation">
            {subcategories.map(subcat => (
              <button
                key={subcat.id}
                className={`category-nav-btn ${selectedSubcategory === subcat.id ? 'active' : ''}`}
                onClick={() => setSelectedSubcategory(subcat.id)}
              >
                {subcat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="collection-container">
        <div className="collection-main">
          
          {/* Top Bar - Product Count & Sort */}
          <div className="collection-top-bar">
            <div className="product-count">
              <span>{filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="collection-controls">
              {/* Mobile Filter Button */}
              <button 
                className="mobile-filter-btn"
                onClick={() => setShowMobileFilters(true)}
              >
                <span className="filter-icon">⚙️</span>
                Filter
              </button>

              {/* Sort Dropdown */}
              <div className="sort-dropdown">
                <label htmlFor="sort-select">Sort By:</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main Grid - Filters + Products */}
          <div className="collection-grid">
            
            {/* Filter Sidebar - Desktop */}
            <div className="filter-sidebar">
              <div className="filter-header">
                <h3>FILTERS</h3>
                <button className="clear-filters-btn" onClick={clearAllFilters}>
                  Clear All
                </button>
              </div>

              {/* Availability Filter */}
              <div className="filter-group">
                <h4 className="filter-group-title">Availability</h4>
                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.availability.includes('in-stock')}
                      onChange={(e) => handleFilterChange('availability', 'in-stock', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    In Stock ({products.filter(p => p.stock > 0).length})
                  </label>
                  <label className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.availability.includes('out-of-stock')}
                      onChange={(e) => handleFilterChange('availability', 'out-of-stock', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Out of Stock ({products.filter(p => p.stock === 0).length})
                  </label>
                </div>
              </div>

              {/* Price Filter */}
              <div className="filter-group">
                <h4 className="filter-group-title">Price</h4>
                <div className="price-range">
                  <div className="price-inputs">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange[0]}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: [Number(e.target.value), prev.priceRange[1]]
                      }))}
                      className="price-input"
                    />
                    <span className="price-separator">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange[1]}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: [prev.priceRange[0], Number(e.target.value)]
                      }))}
                      className="price-input"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Product Grid */}
            <div className="product-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div key={product.id} className="product-card" onClick={() => onProductClick(product)}>
                    
                    {/* Product Image */}
                    <div className="product-image-container">
                      <img src={product.image} alt={product.name} className="product-image" />
                      
                      {/* Badges */}
                      <div className="product-badges">
                        {product.isNew && <span className="badge badge-new">NEW</span>}
                        {product.onSale && <span className="badge badge-sale">SALE</span>}
                        {product.stock === 0 && <span className="badge badge-sold-out">SOLD OUT</span>}
                      </div>
                      
                      {/* Wishlist Button */}
                      <button className="wishlist-btn" title="Add to Wishlist">
                        ♡
                      </button>

                      {/* Quick Actions */}
                      <div className="product-overlay">
                        <button className="quick-view-btn">Quick View</button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="product-info">
                      <div className="product-category">{product.category?.toUpperCase()}</div>
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-description">
                        {product.description || 'Thoughtfully designed footwear for everyday movement and style.'}
                      </p>
                      
                      {/* Rating */}
                      <div className="product-rating">
                        <div className="stars">
                          {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
                        </div>
                        <span className="rating-count">({product.reviews})</span>
                      </div>

                      {/* Price */}
                      <div className="product-price">
                        {product.originalPrice ? (
                          <>
                            <span className="current-price">₹{product.price.toLocaleString()}</span>
                            <span className="original-price">₹{product.originalPrice.toLocaleString()}</span>
                            {product.discount && (
                              <span className="discount-badge">{product.discount}% OFF</span>
                            )}
                          </>
                        ) : (
                          <span className="current-price">₹{product.price.toLocaleString()}</span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <button 
                        className="add-to-cart-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart({...product, size: '9', quantity: 1});
                        }}
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-products">
                  <div className="no-products-icon">👟</div>
                  <h3>No products found</h3>
                  <p>Try adjusting your filters or browse our full collection.</p>
                  <button className="btn-clear-filters" onClick={clearAllFilters}>
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="mobile-filter-modal">
          <div className="mobile-filter-content">
            <div className="mobile-filter-header">
              <h3>Filters</h3>
              <button 
                className="close-mobile-filters"
                onClick={() => setShowMobileFilters(false)}
              >
                ✕
              </button>
            </div>
            
            {/* Mobile filter content - same as desktop but in modal */}
            <div className="mobile-filters">
              <div className="filter-group">
                <h4>Availability</h4>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.availability.includes('in-stock')}
                    onChange={(e) => handleFilterChange('availability', 'in-stock', e.target.checked)}
                  />
                  In Stock
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.availability.includes('out-of-stock')}
                    onChange={(e) => handleFilterChange('availability', 'out-of-stock', e.target.checked)}
                  />
                  Out of Stock
                </label>
              </div>
            </div>

            <div className="mobile-filter-actions">
              <button onClick={clearAllFilters}>Clear All</button>
              <button onClick={() => setShowMobileFilters(false)}>Apply Filters</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollectionPage;
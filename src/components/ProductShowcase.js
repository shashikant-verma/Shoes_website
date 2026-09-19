import React, { useState, useEffect } from 'react';
import './ProductShowcase.css';
import productService from '../services/productService';
import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';

function ProductShowcase({ onAddToCart, categoryFilter, onProductClick, wishlist = [], onToggleWishlist }) {
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 8000]);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load products from API
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await productService.getProducts({
        status: 'active',
        collectionName: ['accessories', 'ozark'].includes(categoryFilter)
          ? categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)
          : undefined,
        limit: 50
      });
      
      if (result.success) {
        // Transform API data to match existing frontend structure
        const transformedProducts = result.data.data.map(product => ({
          id: product._id,
          name: product.name,
          image: product.image,
          category: product.category,
          collectionName: (product.collectionName || product.productType || '').toLowerCase(),
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
          badge: product.badge || 'NEW',
          badgeColor: product.badgeColor || 'primary',
          stock: product.stock || 0,
          description: product.description,
          features: product.features || [],
          rating: product.rating || 0,
          reviews: product.reviewCount || 0,
          featured: product.featured || false
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
  let filteredProducts = [...products];

  // Filter by category
  if (selectedCategory !== 'all') {
    filteredProducts = ['accessories', 'ozark'].includes(selectedCategory)
      ? filteredProducts.filter(p => p.collectionName === selectedCategory)
      : filteredProducts.filter(p => p.category === selectedCategory);
  }

  // Filter by search query
  if (searchQuery) {
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Filter by price range
  filteredProducts = filteredProducts.filter(p =>
    p.price >= priceRange[0] && p.price <= priceRange[1]
  );

  // Sort products
  switch (sortBy) {
    case 'price-low':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      filteredProducts.sort((a, b) => b.rating - a.rating);
      break;
    case 'name':
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      // featured - sort by featured first, then by creation order
      filteredProducts.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
      break;
  }

  // Update when category filter prop changes
  React.useEffect(() => {
    if (categoryFilter) {
      setSelectedCategory(categoryFilter);
    }
  }, [categoryFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSortBy('featured');
    setPriceRange([0, 8000]);
  };

  if (loading) {
    return (
      <section className="product-showcase" id="products">
        <div className="showcase-container">
          <div className="loading-state">
            <div className="products-grid skeleton-grid">
              {[1, 2, 3, 4].map((item) => <ProductSkeleton key={item} />)}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="product-showcase" id="products">
        <div className="showcase-container">
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h3 className="headline-md">Connection Error</h3>
            <p className="body-lg">{error}</p>
            <button className="btn-primary" onClick={loadProducts}>
              <span>RETRY</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="product-showcase" id="products">
      <div className="showcase-container">
        <div className="showcase-header fade-in">
          <div className="telemetry-badge">
            <span className="status-dot pulse-glow"></span>
            <span className="telemetry-label">SHOP THE EDIT</span>
          </div>
          
          <h2 className="section-title">
            <span className="headline-md">Everyday</span>
            <span className="headline-lg gradient-text">Essentials</span>
          </h2>

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search shoes by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery('')}>
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="filter-controls">
            <div className="category-filters">
              {['all', 'men', 'women'].map((cat) => (
                <button
                  key={cat}
                  className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span className="telemetry-label">{cat.toUpperCase()}</span>
                </button>
              ))}
            </div>

            <button 
              className="btn-toggle-filters"
              onClick={() => setShowFilters(!showFilters)}
            >
              <span className="telemetry-label">
                {showFilters ? 'HIDE FILTERS' : 'MORE FILTERS'}
              </span>
              <span className="filter-icon">{showFilters ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="advanced-filters">
              <div className="filter-group">
                <label className="filter-label telemetry-label">SORT BY</label>
                <select 
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label telemetry-label">
                  PRICE RANGE: ₹{priceRange[0]} - ₹{priceRange[1]}
                </label>
                <div className="price-range-inputs">
                  <input
                    type="number"
                    className="price-input"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    min="0"
                    max="8000"
                  />
                  <span className="range-separator">—</span>
                  <input
                    type="number"
                    className="price-input"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    min="0"
                    max="8000"
                  />
                </div>
              </div>

              <button className="btn-reset-filters" onClick={handleResetFilters}>
                <span className="telemetry-label">RESET FILTERS</span>
              </button>
            </div>
          )}

          {/* Results Count */}
          <div className="results-info">
            <span className="telemetry-label">
              {filteredProducts.length} PRODUCT{filteredProducts.length !== 1 ? 'S' : ''} FOUND
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="products-grid">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onProductClick={onProductClick}
                isInWishlist={wishlist.some(item => item.id === product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">😔</div>
            <h3 className="headline-md">No Products Found</h3>
            <p className="body-lg">Try adjusting your filters or search query</p>
            <button className="btn-primary" onClick={handleResetFilters}>
              <span>RESET FILTERS</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductShowcase;

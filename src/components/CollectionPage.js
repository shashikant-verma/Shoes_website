import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './CollectionPage.css';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';

function CollectionPage({ 
  title = 'SHOP', 
  subtitle = 'Explore the complete SoleVibe footwear collection, curated for everyday movement and personal style.', 
  categoryFilter = 'all', 
  saleMode = false,
  heroImage,
  onAddToCart, 
  onProductClick,
  onQuickView,
  wishlist = [],
  onToggleWishlist,
  searchQuery = '',
  onPageChange
}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Layout & Density
  const [gridDensity, setGridDensity] = useState(3);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sorting state: 'featured', 'newest', 'price-low', 'price-high', 'rating'
  const [sortBy, setSortBy] = useState('featured');

  // Subcategory tab state
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');

  // Multi-attribute filter states
  const [filters, setFilters] = useState({
    gender: [],
    category: [],
    size: [],
    drop: [],
    availability: [],
    priceRange: [0, 15000]
  });

  // Hero background images focusing on shoes & athletic movement
  const categoryHeroImages = {
    men: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1600&q=85',
    women: 'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=1600&q=85',
    running: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1600&q=85',
    training: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=85',
    trail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=85',
    racing: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=1600&q=85',
    ozark: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1600&q=85',
    accessories: 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=1600&q=85',
    sale: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1600&q=85',
    'new-arrivals': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600&q=85',
    all: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=85'
  };

  const currentHeroImage = heroImage || 
    categoryHeroImages[categoryFilter] || 
    categoryHeroImages[title?.toLowerCase()] || 
    categoryHeroImages.all;

  // 1. Fetch Categories dynamically from MongoDB
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getCategories({ isActive: 'true' });
        if (res.success && Array.isArray(res.data) && isMounted) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
    return () => { isMounted = false; };
  }, []);

  // 2. URL Query Parameter Synchronization & History Restoration
  const parseUrlParams = useCallback(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlSort = searchParams.get('sort');
      const urlGender = searchParams.get('gender');
      const urlSize = searchParams.get('size');
      const urlDrop = searchParams.get('drop');
      const urlStock = searchParams.get('stock');
      const urlMinPrice = searchParams.get('minPrice');
      const urlMaxPrice = searchParams.get('maxPrice');
      const urlSub = searchParams.get('sub');

      if (urlSort && ['featured', 'newest', 'price-low', 'price-high', 'rating'].includes(urlSort)) {
        setSortBy(urlSort);
      }
      if (urlSub) {
        setSelectedSubcategory(urlSub);
      }

      setFilters(prev => ({
        ...prev,
        gender: urlGender ? urlGender.split(',').filter(Boolean) : prev.gender,
        size: urlSize ? urlSize.split(',').filter(Boolean) : prev.size,
        drop: urlDrop ? urlDrop.split(',').filter(Boolean) : prev.drop,
        availability: urlStock ? urlStock.split(',').filter(Boolean) : prev.availability,
        priceRange: [
          urlMinPrice && !isNaN(Number(urlMinPrice)) ? Number(urlMinPrice) : prev.priceRange[0],
          urlMaxPrice && !isNaN(Number(urlMaxPrice)) ? Number(urlMaxPrice) : prev.priceRange[1]
        ]
      }));
    } catch (e) {
      console.warn('Could not parse URL query parameters:', e);
    }
  }, []);

  // Initialize from URL on mount
  useEffect(() => {
    parseUrlParams();
    const handlePopState = () => parseUrlParams();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseUrlParams]);

  // Update URL search parameters when filters or sorting change
  useEffect(() => {
    try {
      const params = new URLSearchParams();
      if (sortBy !== 'featured') params.set('sort', sortBy);
      if (selectedSubcategory !== 'all') params.set('sub', selectedSubcategory);
      if (filters.gender.length > 0) params.set('gender', filters.gender.join(','));
      if (filters.size.length > 0) params.set('size', filters.size.join(','));
      if (filters.drop.length > 0) params.set('drop', filters.drop.join(','));
      if (filters.availability.length > 0) params.set('stock', filters.availability.join(','));
      if (filters.priceRange[0] > 0) params.set('minPrice', filters.priceRange[0].toString());
      if (filters.priceRange[1] < 15000) params.set('maxPrice', filters.priceRange[1].toString());

      const queryStr = params.toString();
      const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    } catch {
      // Safe fallback if history API is restricted
    }
  }, [sortBy, selectedSubcategory, filters]);

  // 3. Load Products from Backend API
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isGender = ['men', 'women'].includes(categoryFilter);
      const isSpecialCollection = ['accessories', 'ozark'].includes(categoryFilter);

      const params = {
        status: 'active',
        limit: 100 // Fetch full catalog for seamless client-side filtering
      };

      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (isGender) {
        params.category = categoryFilter;
      } else if (isSpecialCollection) {
        params.collectionName = categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1);
      }

      const result = await productService.getProducts(params);

      if (result.success && result.data && Array.isArray(result.data.data)) {
        const transformed = result.data.data.map(p => ({
          id: p._id,
          _id: p._id,
          name: p.name,
          slug: p.slug,
          image: p.image,
          images: p.images && p.images.length > 0 ? p.images : [p.image],
          category: p.category || 'unisex',
          gender: p.gender || p.category || 'unisex',
          productType: p.productType || 'Footwear',
          collectionName: p.collectionName || '',
          brand: p.brand || 'SoleVibe',
          price: Number(p.price) || 0,
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          discount: p.discount ? Number(p.discount) : null,
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          colors: Array.isArray(p.colors) ? p.colors : [],
          specifications: p.specifications || {},
          features: Array.isArray(p.features) ? p.features : [],
          stock: Number(p.stock) || 0,
          rating: Number(p.rating) || 0,
          reviewCount: Number(p.reviewCount) || 0,
          badge: p.badge || (p.stock === 0 ? 'SOLD OUT' : (p.isNew ? 'NEW' : null)),
          badgeColor: p.badgeColor || 'primary',
          featured: Boolean(p.featured),
          isNew: Boolean(p.isNew),
          onSale: Boolean(p.onSale || (p.originalPrice && p.originalPrice > p.price)),
          description: p.description || ''
        }));
        setProducts(transformed);
      } else {
        setError(result.message || 'Failed to load products');
        setProducts([]);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Connection error while fetching products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Dynamic Subcategories for Tab Bar
  const subcategories = useMemo(() => {
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
    if (categoryFilter === 'running') {
      return [
        { id: 'all', name: 'ALL' },
        { id: 'road-racing', name: 'ROAD RACING' },
        { id: 'trail', name: 'TRAIL' },
        { id: 'tempo', name: 'TEMPO RUN' }
      ];
    }
    return [
      { id: 'all', name: 'ALL' },
      { id: 'running', name: 'RUNNING' },
      { id: 'trail', name: 'TRAIL' },
      { id: 'training', name: 'TRAINING' },
      { id: 'lifestyle', name: 'LIFESTYLE' },
      { id: 'road-racing', name: 'ROAD RACING' }
    ];
  }, [categoryFilter]);

  // Available Sizes derived from loaded products
  const availableSizes = useMemo(() => {
    const sizeSet = new Set();
    products.forEach(p => {
      if (Array.isArray(p.sizes)) {
        p.sizes.forEach(sz => sizeSet.add(sz));
      }
    });
    // Standard numerical ordering for shoe sizes
    return Array.from(sizeSet).sort((a, b) => {
      const numA = parseFloat(a.replace(/[^0-9.]/g, ''));
      const numB = parseFloat(b.replace(/[^0-9.]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [products]);

  // Available Heel-to-Toe Drops derived from loaded products
  const availableDrops = useMemo(() => {
    const dropSet = new Set();
    products.forEach(p => {
      if (p.specifications?.drop) {
        dropSet.add(p.specifications.drop);
      }
    });
    return Array.from(dropSet).sort((a, b) => {
      const numA = parseInt(a, 10) || 0;
      const numB = parseInt(b, 10) || 0;
      return numA - numB;
    });
  }, [products]);

  // Filtering & Sorting pipeline
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Search Query filter (client-side safety check)
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.productType && p.productType.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    // 2. Special page modes
    if (saleMode) {
      result = result.filter(p => p.onSale || p.originalPrice || p.discount);
    }
    if (categoryFilter === 'new-arrivals') {
      result = result.filter(p => p.isNew);
    }
    if (categoryFilter === 'running') {
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes('run')) ||
        (p.productType && p.productType.toLowerCase().includes('run')) ||
        (p.description && p.description.toLowerCase().includes('run'))
      );
    }
    if (categoryFilter === 'training') {
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes('train')) ||
        (p.productType && p.productType.toLowerCase().includes('train')) ||
        (p.description && p.description.toLowerCase().includes('train'))
      );
    }
    if (categoryFilter === 'trail') {
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes('trail')) ||
        (p.productType && p.productType.toLowerCase().includes('trail')) ||
        (p.description && p.description.toLowerCase().includes('trail'))
      );
    }
    if (categoryFilter === 'racing') {
      result = result.filter(p => 
        (p.name && (p.name.toLowerCase().includes('race') || p.name.toLowerCase().includes('racing') || p.name.toLowerCase().includes('carbon'))) ||
        (p.description && (p.description.toLowerCase().includes('race') || p.description.toLowerCase().includes('racing')))
      );
    }

    // 3. Subcategory Tab Filter
    if (selectedSubcategory !== 'all') {
      result = result.filter(p => {
        const text = `${p.name} ${p.productType} ${p.description}`.toLowerCase();
        switch (selectedSubcategory) {
          case 'running':
            return text.includes('run') || text.includes('relay') || text.includes('tempo');
          case 'road-racing':
            return text.includes('race') || text.includes('racing') || text.includes('carbon');
          case 'trail':
            return text.includes('trail') || text.includes('ridge') || text.includes('outdoor');
          case 'training':
            return text.includes('train') || text.includes('flex') || text.includes('cross');
          case 'lifestyle':
            return text.includes('lifestyle') || text.includes('sneaker') || text.includes('casual');
          case 'tempo':
            return text.includes('tempo') || text.includes('speed') || text.includes('pace');
          case 'socks':
            return text.includes('sock');
          case 'insoles':
            return text.includes('insole');
          case 'care':
            return text.includes('care') || text.includes('clean');
          case 'laces':
            return text.includes('lace');
          case 'hiking':
            return text.includes('hike') || text.includes('trek') || text.includes('boot');
          case 'all-weather':
            return text.includes('weather') || text.includes('shield') || text.includes('water');
          case 'rugged':
            return text.includes('rugged') || text.includes('boot') || text.includes('durable');
          default:
            return true;
        }
      });
    }

    // 4. Gender Filter
    if (filters.gender.length > 0) {
      result = result.filter(p => 
        filters.gender.includes(p.gender) || 
        (filters.gender.includes('unisex') && p.gender === 'unisex')
      );
    }

    // 5. Size Filter
    if (filters.size.length > 0) {
      result = result.filter(p => 
        Array.isArray(p.sizes) && filters.size.some(sz => p.sizes.includes(sz))
      );
    }

    // 6. Heel-to-Toe Drop Filter
    if (filters.drop.length > 0) {
      result = result.filter(p => 
        p.specifications?.drop && filters.drop.includes(p.specifications.drop)
      );
    }

    // 7. Stock / Availability Filter
    if (filters.availability.length > 0) {
      if (filters.availability.includes('in-stock') && !filters.availability.includes('out-of-stock')) {
        result = result.filter(p => p.stock > 0);
      } else if (filters.availability.includes('out-of-stock') && !filters.availability.includes('in-stock')) {
        result = result.filter(p => p.stock === 0);
      }
    }

    // 8. Price Range Filter
    result = result.filter(p => 
      p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // 9. Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default: // featured
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [products, searchQuery, saleMode, categoryFilter, selectedSubcategory, filters, sortBy]);

  // Filter Handlers
  const handleToggleFilter = (group, value) => {
    setFilters(prev => {
      const current = prev[group] || [];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [group]: updated };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      gender: [],
      category: [],
      size: [],
      drop: [],
      availability: [],
      priceRange: [0, 15000]
    });
    setSelectedSubcategory('all');
    setSortBy('featured');
  };

  const hasActiveFilters = 
    filters.gender.length > 0 ||
    filters.size.length > 0 ||
    filters.drop.length > 0 ||
    filters.availability.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 15000 ||
    selectedSubcategory !== 'all';

  // Lock body scroll when mobile filter drawer is open
  useEffect(() => {
    if (showMobileFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileFilters]);

  // Handle Escape key to close mobile filter drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showMobileFilters) {
        setShowMobileFilters(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMobileFilters]);

  return (
    <div className="collection-page" id="shop-main">
      {/* 1. Photographic Editorial Header */}
      <section className={`collection-header ${currentHeroImage ? 'has-hero-bg' : ''}`} aria-label="Collection Header">
        {currentHeroImage && (
          <div className="collection-hero-bg-layer" aria-hidden="true">
            <img 
              src={currentHeroImage} 
              alt="" 
              className="collection-hero-bg-img" 
            />
            <div className="collection-hero-overlay" />
          </div>
        )}

        <div className="collection-container relative-z">
          <div className="collection-hero">
            <span className="collection-badge-tag">
              {searchQuery ? 'SEARCH RESULTS' : 'SOLEVIBE EDIT'}
            </span>
            <h1 className="collection-title">
              {searchQuery ? `SEARCH: "${searchQuery}"` : title}
            </h1>
            <p className="collection-subtitle">
              {searchQuery ? `Showing matching footwear for "${searchQuery}"` : subtitle}
            </p>
          </div>

          {/* Subcategory Pill Navigation */}
          <nav className="category-navigation" aria-label="Collection Subcategories">
            {subcategories.map(subcat => (
              <button
                key={subcat.id}
                type="button"
                className={`category-nav-btn ${selectedSubcategory === subcat.id ? 'active' : ''}`}
                onClick={() => setSelectedSubcategory(subcat.id)}
                aria-pressed={selectedSubcategory === subcat.id}
              >
                {subcat.name}
              </button>
            ))}
          </nav>
        </div>
      </section>

      {/* 2. Main Catalog Body */}
      <div className="collection-container">
        <div className="collection-main">
          
          {/* Top Bar - Count, Density, Mobile Trigger & Sort */}
          <div className="collection-top-bar">
            <div className="product-count" aria-live="polite">
              <span className="count-number">{filteredProducts.length}</span>
              <span className="count-label">
                {filteredProducts.length === 1 ? 'PRODUCT FOUND' : 'PRODUCTS FOUND'}
              </span>
            </div>

            <div className="collection-controls">
              {/* Desktop Grid Density Switcher */}
              <div className="grid-density-controls" aria-label="Grid column layout">
                <span className="grid-density-label">COLUMNS:</span>
                {[2, 3, 4].map(density => (
                  <button
                    key={density}
                    type="button"
                    className={`density-btn ${gridDensity === density ? 'active' : ''}`}
                    onClick={() => setGridDensity(density)}
                    aria-label={`${density} column grid view`}
                    aria-pressed={gridDensity === density}
                  >
                    {density}
                  </button>
                ))}
              </div>

              {/* Mobile Filter Button */}
              <button 
                type="button"
                className="mobile-filter-btn"
                onClick={() => setShowMobileFilters(true)}
                aria-label="Open filter drawer"
                aria-haspopup="dialog"
              >
                <span className="filter-icon" aria-hidden="true">⚙</span>
                <span>FILTERS</span>
                {hasActiveFilters && <span className="active-filter-indicator">●</span>}
              </button>

              {/* Sorting Dropdown */}
              <div className="sort-dropdown">
                <label htmlFor="sort-select" className="sort-label">SORT:</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                  aria-label="Sort products by"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="active-filters-bar" aria-label="Active filters">
              <span className="active-filters-label">ACTIVE:</span>
              <div className="filter-chips">
                {selectedSubcategory !== 'all' && (
                  <button 
                    type="button"
                    className="filter-chip"
                    onClick={() => setSelectedSubcategory('all')}
                  >
                    Sub: {selectedSubcategory.toUpperCase()} ✕
                  </button>
                )}
                {filters.gender.map(g => (
                  <button 
                    key={g} 
                    type="button" 
                    className="filter-chip"
                    onClick={() => handleToggleFilter('gender', g)}
                  >
                    Gender: {g.toUpperCase()} ✕
                  </button>
                ))}
                {filters.size.map(sz => (
                  <button 
                    key={sz} 
                    type="button" 
                    className="filter-chip"
                    onClick={() => handleToggleFilter('size', sz)}
                  >
                    Size: {sz} ✕
                  </button>
                ))}
                {filters.drop.map(d => (
                  <button 
                    key={d} 
                    type="button" 
                    className="filter-chip"
                    onClick={() => handleToggleFilter('drop', d)}
                  >
                    Drop: {d} ✕
                  </button>
                ))}
                {filters.availability.map(st => (
                  <button 
                    key={st} 
                    type="button" 
                    className="filter-chip"
                    onClick={() => handleToggleFilter('availability', st)}
                  >
                    {st === 'in-stock' ? 'In Stock' : 'Out of Stock'} ✕
                  </button>
                ))}
                {(filters.priceRange[0] > 0 || filters.priceRange[1] < 15000) && (
                  <button 
                    type="button" 
                    className="filter-chip"
                    onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, 15000] }))}
                  >
                    ₹{filters.priceRange[0].toLocaleString()} - ₹{filters.priceRange[1].toLocaleString()} ✕
                  </button>
                )}
                <button 
                  type="button" 
                  className="clear-all-chip"
                  onClick={clearAllFilters}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Grid Layout: Desktop Sidebar + Product Grid */}
          <div className="collection-grid-layout">
            
            {/* Desktop Sticky Filter Sidebar */}
            <aside className="filter-sidebar" aria-label="Catalog filters">
              <div className="filter-header">
                <span className="filter-title">FILTERS</span>
                {hasActiveFilters && (
                  <button 
                    type="button" 
                    className="clear-filters-link" 
                    onClick={clearAllFilters}
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* 1. Gender Filter */}
              <div className="filter-group">
                <span className="filter-group-title">GENDER</span>
                <div className="filter-options">
                  {[
                    { id: 'men', label: 'Men' },
                    { id: 'women', label: 'Women' },
                    { id: 'unisex', label: 'Unisex' }
                  ].map(({ id, label }) => {
                    const count = products.filter(p => p.gender === id).length;
                    return (
                      <label key={id} className="filter-option">
                        <input
                          type="checkbox"
                          checked={filters.gender.includes(id)}
                          onChange={() => handleToggleFilter('gender', id)}
                        />
                        <span className="custom-check" aria-hidden="true" />
                        <span className="option-label">{label}</span>
                        <span className="option-count">({count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 2. Shoe Size Filter */}
              {availableSizes.length > 0 && (
                <div className="filter-group">
                  <span className="filter-group-title">SIZE (UK/IN)</span>
                  <div className="size-pill-grid">
                    {availableSizes.map(size => {
                      const isSelected = filters.size.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          className={`size-filter-pill ${isSelected ? 'active' : ''}`}
                          onClick={() => handleToggleFilter('size', size)}
                          aria-pressed={isSelected}
                        >
                          {size.replace(/UK\s*/i, '')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Heel-to-Toe Drop Filter */}
              {availableDrops.length > 0 && (
                <div className="filter-group">
                  <span className="filter-group-title">HEEL-TO-TOE DROP</span>
                  <div className="drop-pill-grid">
                    {availableDrops.map(drop => {
                      const isSelected = filters.drop.includes(drop);
                      return (
                        <button
                          key={drop}
                          type="button"
                          className={`drop-filter-pill ${isSelected ? 'active' : ''}`}
                          onClick={() => handleToggleFilter('drop', drop)}
                          aria-pressed={isSelected}
                        >
                          {drop}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Price Range Filter */}
              <div className="filter-group">
                <span className="filter-group-title">PRICE (₹)</span>
                <div className="price-slider-wrap">
                  <div className="price-inputs-row">
                    <div className="price-field">
                      <span className="field-currency">₹</span>
                      <input
                        type="number"
                        min="0"
                        max="15000"
                        value={filters.priceRange[0]}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          priceRange: [Math.max(0, Number(e.target.value) || 0), prev.priceRange[1]]
                        }))}
                        className="price-num-input"
                        aria-label="Minimum price"
                      />
                    </div>
                    <span className="price-dash">–</span>
                    <div className="price-field">
                      <span className="field-currency">₹</span>
                      <input
                        type="number"
                        min="0"
                        max="15000"
                        value={filters.priceRange[1]}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          priceRange: [prev.priceRange[0], Math.max(0, Number(e.target.value) || 0)]
                        }))}
                        className="price-num-input"
                        aria-label="Maximum price"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15000"
                    step="500"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: [prev.priceRange[0], Number(e.target.value)]
                    }))}
                    className="price-range-slider"
                    aria-label="Maximum price slider"
                  />
                </div>
              </div>

              {/* 5. Stock Availability Filter */}
              <div className="filter-group">
                <span className="filter-group-title">AVAILABILITY</span>
                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.availability.includes('in-stock')}
                      onChange={() => handleToggleFilter('availability', 'in-stock')}
                    />
                    <span className="custom-check" aria-hidden="true" />
                    <span className="option-label">In Stock</span>
                    <span className="option-count">
                      ({products.filter(p => p.stock > 0).length})
                    </span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.availability.includes('out-of-stock')}
                      onChange={() => handleToggleFilter('availability', 'out-of-stock')}
                    />
                    <span className="custom-check" aria-hidden="true" />
                    <span className="option-label">Out of Stock</span>
                    <span className="option-count">
                      ({products.filter(p => p.stock === 0).length})
                    </span>
                  </label>
                </div>
              </div>

              {/* 6. Dynamic Categories (from MongoDB) */}
              {categories.length > 0 && (
                <div className="filter-group">
                  <span className="filter-group-title">CATEGORIES</span>
                  <div className="category-links-list">
                    {categories.map(cat => (
                      <button
                        key={cat.slug || cat._id}
                        type="button"
                        className={`cat-sidebar-link ${categoryFilter === cat.slug ? 'active' : ''}`}
                        onClick={() => {
                          if (onPageChange) {
                            onPageChange(cat.slug);
                          }
                        }}
                      >
                        <span className="cat-sidebar-name">{cat.name}</span>
                        {cat.productCount !== undefined && (
                          <span className="cat-sidebar-count">({cat.productCount})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* Product Grid Area */}
            <main className="product-grid-container" aria-label="Footwear catalog">
              {loading ? (
                /* Loading State: 8 Shimmer Skeletons */
                <div className={`product-grid density-${gridDensity}`}>
                  {[...Array(8)].map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                /* Error State */
                <div className="catalog-error-state" role="alert">
                  <span className="state-icon">⚠️</span>
                  <h3 className="state-title">CONNECTION ERROR</h3>
                  <p className="state-desc">{error}</p>
                  <button 
                    type="button" 
                    className="btn-primary state-retry-btn" 
                    onClick={loadProducts}
                  >
                    <span>TRY AGAIN</span>
                    <span className="arrow-icon" aria-hidden="true">↻</span>
                  </button>
                </div>
              ) : filteredProducts.length > 0 ? (
                /* Active Product Grid */
                <div className={`product-grid density-${gridDensity}`}>
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product.id || product._id}
                      product={product}
                      index={index}
                      onProductClick={onProductClick}
                      onQuickView={onQuickView}
                      onAddToCart={onAddToCart}
                      isInWishlist={wishlist.some(item => (item.id || item._id) === (product.id || product._id))}
                      onToggleWishlist={onToggleWishlist}
                    />
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="catalog-empty-state" role="status">
                  <span className="empty-shoe-icon" aria-hidden="true">👟</span>
                  <h3 className="empty-title">NO MATCHING FOOTWEAR FOUND</h3>
                  <p className="empty-desc">
                    We could not find any shoes matching your selected filters. 
                    Try broadening your price range, choosing another size, or resetting your filters.
                  </p>
                  <button 
                    type="button" 
                    className="btn-primary empty-reset-btn"
                    onClick={clearAllFilters}
                  >
                    <span>RESET ALL FILTERS</span>
                    <span className="arrow-icon" aria-hidden="true">↺</span>
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* 3. Mobile Filter Drawer Dialog */}
      {showMobileFilters && (
        <div 
          className="mobile-filter-drawer-backdrop" 
          onClick={() => setShowMobileFilters(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Filter Options"
        >
          <div 
            className="mobile-filter-drawer" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <h3 className="drawer-title">FILTERS</h3>
              <button 
                type="button"
                className="drawer-close-btn"
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              {/* Gender */}
              <div className="drawer-section">
                <span className="drawer-section-title">GENDER</span>
                <div className="filter-options">
                  {[
                    { id: 'men', label: 'Men' },
                    { id: 'women', label: 'Women' },
                    { id: 'unisex', label: 'Unisex' }
                  ].map(({ id, label }) => (
                    <label key={id} className="filter-option">
                      <input
                        type="checkbox"
                        checked={filters.gender.includes(id)}
                        onChange={() => handleToggleFilter('gender', id)}
                      />
                      <span className="custom-check" aria-hidden="true" />
                      <span className="option-label">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              {availableSizes.length > 0 && (
                <div className="drawer-section">
                  <span className="drawer-section-title">SIZE (UK/IN)</span>
                  <div className="size-pill-grid">
                    {availableSizes.map(size => {
                      const isSelected = filters.size.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          className={`size-filter-pill ${isSelected ? 'active' : ''}`}
                          onClick={() => handleToggleFilter('size', size)}
                        >
                          {size.replace(/UK\s*/i, '')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Heel Drop */}
              {availableDrops.length > 0 && (
                <div className="drawer-section">
                  <span className="drawer-section-title">HEEL-TO-TOE DROP</span>
                  <div className="drop-pill-grid">
                    {availableDrops.map(drop => {
                      const isSelected = filters.drop.includes(drop);
                      return (
                        <button
                          key={drop}
                          type="button"
                          className={`drop-filter-pill ${isSelected ? 'active' : ''}`}
                          onClick={() => handleToggleFilter('drop', drop)}
                        >
                          {drop}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="drawer-section">
                <span className="drawer-section-title">MAX PRICE: ₹{filters.priceRange[1].toLocaleString()}</span>
                <input
                  type="range"
                  min="0"
                  max="15000"
                  step="500"
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priceRange: [prev.priceRange[0], Number(e.target.value)]
                  }))}
                  className="price-range-slider"
                />
              </div>

              {/* Availability */}
              <div className="drawer-section">
                <span className="drawer-section-title">AVAILABILITY</span>
                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.availability.includes('in-stock')}
                      onChange={() => handleToggleFilter('availability', 'in-stock')}
                    />
                    <span className="custom-check" aria-hidden="true" />
                    <span className="option-label">In Stock</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.availability.includes('out-of-stock')}
                      onChange={() => handleToggleFilter('availability', 'out-of-stock')}
                    />
                    <span className="custom-check" aria-hidden="true" />
                    <span className="option-label">Out of Stock</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button 
                type="button" 
                className="btn-drawer-clear"
                onClick={clearAllFilters}
              >
                Clear All
              </button>
              <button 
                type="button" 
                className="btn-primary btn-drawer-apply"
                onClick={() => setShowMobileFilters(false)}
              >
                View {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(CollectionPage);

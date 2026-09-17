import React, { Suspense, useRef, useState } from 'react';
import './ProductShowcase.css';

function ProductShowcase({ onAddToCart, categoryFilter, onProductClick }) {
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [showFilters, setShowFilters] = useState(false);
  const products = [
    {
      id: 'p1',
      name: 'PHANTOM CARBON V4',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      category: 'men',
      price: 285.00,
      specs: {
        weight: '179g',
        drop: '3.2mm',
        energy: '+14.8%'
      },
      badge: 'LAB VERIFIED',
      badgeColor: 'tertiary',
      stock: 12,
      description: 'Ultra-compressed carbon-plate architecture for maximum propulsion velocity. Features advanced foam technology and responsive plate geometry.',
      features: ['Carbon fiber plate', 'Breathable mesh upper', 'Enhanced energy return', 'Lightweight construction'],
      rating: 4.8,
      reviews: 234
    },
    {
      id: 'p2',
      name: 'AI JONDAR PRO',
      image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
      category: 'men',
      price: 325.00,
      specs: {
        weight: '242g',
        drop: '6mm',
        energy: '+12.4%'
      },
      badge: 'ELITE VERIFIED',
      badgeColor: 'secondary',
      stock: 8,
      description: 'Adaptive intelligence traction matrix for variable terrain protocols. Built for trail runners who demand precision.',
      features: ['All-terrain grip', 'Water-resistant upper', 'Rock plate protection', 'Durable rubber outsole'],
      rating: 4.9,
      reviews: 189
    },
    {
      id: 'p3',
      name: 'VELOCITY ZERO',
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600',
      category: 'men',
      price: 425.00,
      specs: {
        weight: '156g',
        drop: '2.8mm',
        energy: '+18.2%'
      },
      badge: 'COMPETITION LOCKED',
      badgeColor: 'primary',
      stock: 5,
      description: 'Sub-160g biomechanical acceleration engine for elite competition. The lightest racing shoe in our lineup.',
      features: ['Ultra-lightweight', 'Race-day geometry', 'Maximum energy return', 'Aerodynamic design'],
      rating: 5.0,
      reviews: 156
    },
    {
      id: 'p4',
      name: 'KINETIC STRIDE',
      image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
      category: 'men',
      price: 295.00,
      specs: {
        weight: '198g',
        drop: '4mm',
        energy: '+13.6%'
      },
      badge: 'NEW RELEASE',
      badgeColor: 'tertiary',
      stock: 15,
      description: 'Neural-mapped cushioning matrix for long-distance optimization. Perfect for marathons and ultra distances.',
      features: ['Adaptive cushioning', 'Stability support', 'Breathable design', 'Long-distance comfort'],
      rating: 4.7,
      reviews: 203
    },
    {
      id: 'p5',
      name: 'AURORA SPRINT',
      image: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600',
      category: 'women',
      price: 265.00,
      specs: {
        weight: '168g',
        drop: '3.5mm',
        energy: '+15.2%'
      },
      badge: 'BEST SELLER',
      badgeColor: 'primary',
      stock: 20,
      description: 'Engineered for female biomechanics with precision-tuned responsiveness. Ideal for speed training and races.',
      features: ['Women-specific fit', 'Responsive foam', 'Secure lockdown', 'Stylish design'],
      rating: 4.9,
      reviews: 312
    },
    {
      id: 'p6',
      name: 'ZENITH FLOW',
      image: 'https://images.unsplash.com/photo-1603808033176-d3a5f4fa4c28?w=600',
      category: 'women',
      price: 245.00,
      specs: {
        weight: '185g',
        drop: '5mm',
        energy: '+13.8%'
      },
      badge: 'COMFORT PLUS',
      badgeColor: 'secondary',
      stock: 18,
      description: 'Plush cushioning meets performance engineering. Perfect for daily training runs and recovery miles.',
      features: ['Extra cushioning', 'Smooth transitions', 'Durable construction', 'All-day comfort'],
      rating: 4.6,
      reviews: 178
    },
    {
      id: 'p7',
      name: 'VORTEX ELITE',
      image: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=600',
      category: 'women',
      price: 385.00,
      specs: {
        weight: '162g',
        drop: '3mm',
        energy: '+16.8%'
      },
      badge: 'PRO SERIES',
      badgeColor: 'tertiary',
      stock: 10,
      description: 'Elite-level performance with aerodynamic profiling. Designed for competitive athletes.',
      features: ['Pro-level specs', 'Aerodynamic profile', 'Premium materials', 'Race-proven design'],
      rating: 4.8,
      reviews: 145
    },
    {
      id: 'p8',
      name: 'THUNDER TRAIL',
      image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600',
      category: 'men',
      price: 310.00,
      specs: {
        weight: '268g',
        drop: '7mm',
        energy: '+11.5%'
      },
      badge: 'TRAIL BEAST',
      badgeColor: 'secondary',
      stock: 14,
      description: 'Built for rugged terrain with maximum protection. Conquer any trail with confidence.',
      features: ['Aggressive traction', 'Toe protection', 'Trail-specific design', 'Enhanced stability'],
      rating: 4.7,
      reviews: 167
    },
    {
      id: 'p9',
      name: 'NEXUS ULTRA',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600',
      category: 'men',
      price: 340.00,
      specs: {
        weight: '205g',
        drop: '4.5mm',
        energy: '+14.2%'
      },
      badge: 'ULTRA TECH',
      badgeColor: 'secondary',
      stock: 11,
      description: 'Next-generation cushioning with reactive foam core. Designed for runners who demand the best of both worlds.',
      features: ['Dual-density foam', 'Enhanced grip', 'Reflective details', 'Water repellent'],
      rating: 4.8,
      reviews: 198
    },
    {
      id: 'p10',
      name: 'STEALTH RUNNER',
      image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600',
      category: 'men',
      price: 275.00,
      specs: {
        weight: '189g',
        drop: '3.8mm',
        energy: '+13.9%'
      },
      badge: 'NIGHT EDITION',
      badgeColor: 'tertiary',
      stock: 16,
      description: 'Engineered for urban runners who train before dawn or after dusk. Maximum visibility with reflective technology.',
      features: ['360° reflective', 'Cushioned heel', 'Breathable knit', 'Urban design'],
      rating: 4.6,
      reviews: 221
    },
    {
      id: 'p11',
      name: 'APEX SWIFT',
      image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600',
      category: 'men',
      price: 299.00,
      specs: {
        weight: '174g',
        drop: '3.4mm',
        energy: '+15.6%'
      },
      badge: 'SPEED KING',
      badgeColor: 'primary',
      stock: 9,
      description: 'Built for speed demons. Ultra-responsive midsole delivers explosive energy return for tempo runs and intervals.',
      features: ['Race-tuned foam', 'Grip outsole', 'Minimalist upper', 'Speed lacing'],
      rating: 4.9,
      reviews: 276
    },
    {
      id: 'p12',
      name: 'GRAVITY DEFIER',
      image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600',
      category: 'men',
      price: 365.00,
      specs: {
        weight: '221g',
        drop: '5.5mm',
        energy: '+16.1%'
      },
      badge: 'MAX CUSHION',
      badgeColor: 'secondary',
      stock: 13,
      description: 'Maximum cushioning for maximum comfort. Perfect for runners recovering from injury or logging high mileage.',
      features: ['Extra cushioning', 'Stability frame', 'Plush collar', 'Wide toe box'],
      rating: 4.7,
      reviews: 187
    },
    {
      id: 'p13',
      name: 'LUNA GLIDE',
      image: 'https://images.unsplash.com/photo-1584735174965-e62f7f495e88?w=600',
      category: 'women',
      price: 255.00,
      specs: {
        weight: '172g',
        drop: '4mm',
        energy: '+14.4%'
      },
      badge: 'MOONLIGHT',
      badgeColor: 'tertiary',
      stock: 22,
      description: 'Smooth transitions and plush comfort for runners who value the feel-good factor in every stride.',
      features: ['Soft landing', 'Flexible forefoot', 'Padded tongue', 'Elegant design'],
      rating: 4.8,
      reviews: 294
    },
    {
      id: 'p14',
      name: 'PHOENIX RISE',
      image: 'https://images.unsplash.com/photo-1606644515441-6ab163a608f6?w=600',
      category: 'women',
      price: 335.00,
      specs: {
        weight: '165g',
        drop: '3.2mm',
        energy: '+17.3%'
      },
      badge: 'REBORN',
      badgeColor: 'primary',
      stock: 7,
      description: 'Rise from the ashes with revolutionary energy return technology. Built for PRs and podium finishes.',
      features: ['Meta-rocker', 'Carbon propulsion', 'Race geometry', 'Elite performance'],
      rating: 5.0,
      reviews: 142
    },
    {
      id: 'p15',
      name: 'CRYSTAL DASH',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600',
      category: 'women',
      price: 270.00,
      specs: {
        weight: '178g',
        drop: '4.2mm',
        energy: '+13.7%'
      },
      badge: 'SPARKLE',
      badgeColor: 'tertiary',
      stock: 19,
      description: 'Performance meets style with crystalline design elements. Stand out on the track or the street.',
      features: ['Stylish design', 'Comfortable fit', 'Durable sole', 'Color options'],
      rating: 4.6,
      reviews: 265
    },
    {
      id: 'p16',
      name: 'NIMBUS CLOUD',
      image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600',
      category: 'women',
      price: 289.00,
      specs: {
        weight: '191g',
        drop: '5mm',
        energy: '+12.9%'
      },
      badge: 'CLOUD TECH',
      badgeColor: 'secondary',
      stock: 17,
      description: 'Run on clouds with our softest cushioning system. Ideal for recovery runs and easy days.',
      features: ['Cloud cushioning', 'Pillow top', 'Seamless upper', 'All-day wear'],
      rating: 4.7,
      reviews: 231
    }
  ];

  // Filter and sort products
  let filteredProducts = products;

  // Filter by category
  if (selectedCategory !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
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
      // featured - keep original order
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
    setPriceRange([0, 500]);
  };

  return (
    <section className="product-showcase" id="products">
      <div className="showcase-container">
        <div className="showcase-header fade-in">
          <div className="telemetry-badge">
            <span className="status-dot pulse-glow"></span>
            <span className="telemetry-label">TRENDING RELEASES</span>
          </div>
          
          <h2 className="section-title">
            <span className="headline-md">PRECISION</span>
            <span className="headline-lg gradient-text">BIOMECHANICS</span>
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
                  PRICE RANGE: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <div className="price-range-inputs">
                  <input
                    type="number"
                    className="price-input"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    min="0"
                    max="500"
                  />
                  <span className="range-separator">—</span>
                  <input
                    type="number"
                    className="price-input"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    min="0"
                    max="500"
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
              <div
                key={product.id}
                className="product-card glass-panel fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => onProductClick(product)}
              >
                <div className={`product-badge badge-${product.badgeColor}`}>
                  <span className="telemetry-label">{product.badge}</span>
                </div>

                <div className="product-image-container">
                  <img src={product.image} alt={product.name} className="product-image" />
                </div>

                <div className="product-info">
                  <h3 className="product-name headline-md">{product.name}</h3>
                  
                  {/* Rating */}
                  <div className="product-rating">
                    <span className="rating-stars">{'⭐'.repeat(Math.floor(product.rating))}</span>
                    <span className="rating-value telemetry-label">{product.rating} ({product.reviews})</span>
                  </div>

                  <p className="product-description body-sm">{product.description}</p>

                  <div className="product-specs">
                    <div className="spec-item">
                      <span className="telemetry-label">WEIGHT</span>
                      <span className="telemetry-metric">{product.specs.weight}</span>
                    </div>
                    <div className="spec-item">
                      <span className="telemetry-label">DROP</span>
                      <span className="telemetry-metric">{product.specs.drop}</span>
                    </div>
                    <div className="spec-item">
                      <span className="telemetry-label">ENERGY</span>
                      <span className="telemetry-metric">{product.specs.energy}</span>
                    </div>
                  </div>

                  <div className="product-footer">
                    <div className="product-price">
                      <span className="telemetry-metric price-amount">${product.price.toFixed(2)}</span>
                      <span className="telemetry-label stock-info">
                        {product.stock} IN STOCK
                      </span>
                    </div>

                    <button 
                      className="btn-view-details"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductClick(product);
                      }}
                    >
                      <span className="telemetry-label">VIEW DETAILS</span>
                      <span className="btn-icon">→</span>
                    </button>
                  </div>
                </div>
              </div>
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

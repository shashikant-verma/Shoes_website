import React, { useRef, useState } from 'react';
import './HomePage.css';

function HomePage({ onPageChange }) {
  const carouselRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const featuredProducts = [
    {
      id: 'p1',
      name: 'PHANTOM CARBON V4',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      price: 285.00,
      originalPrice: 320.00,
      badge: 'BESTSELLER',
      badgeColor: 'primary'
    },
    {
      id: 'p5',
      name: 'AURORA SPRINT',
      image: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600',
      price: 265.00,
      originalPrice: 295.00,
      badge: 'NEW',
      badgeColor: 'secondary'
    },
    {
      id: 'p3',
      name: 'VELOCITY ZERO',
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600',
      price: 425.00,
      badge: 'PREMIUM',
      badgeColor: 'tertiary'
    },
    {
      id: 'p7',
      name: 'VORTEX ELITE',
      image: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=600',
      price: 385.00,
      originalPrice: 425.00,
      badge: 'SALE',
      badgeColor: 'primary'
    },
    {
      id: 'p2',
      name: 'AI JONDAR PRO',
      image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
      price: 325.00,
      badge: 'LIMITED',
      badgeColor: 'secondary'
    },
    {
      id: 'p8',
      name: 'THUNDER TRAIL',
      image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600',
      price: 310.00,
      originalPrice: 340.00,
      badge: 'TRENDING',
      badgeColor: 'tertiary'
    }
  ];

  const scrollCarousel = (direction) => {
    if (carouselRef.current && !isScrolling) {
      setIsScrolling(true);
      const scrollAmount = 400;
      const newScrollLeft = carouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      setTimeout(() => setIsScrolling(false), 500);
    }
  };

  return (
    <section className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span>NEW COLLECTION 2024</span>
            </div>
            
            <h1 className="hero-title">
              <span className="hero-subtitle">Performance Redefined</span>
              <span className="hero-main">KINETIC</span>
              <span className="hero-accent">STRIDE</span>
            </h1>
            
            <p className="hero-description">
              Experience the future of athletic footwear with our cutting-edge 
              carbon-plate technology and biomechanical design. Engineered for champions, 
              crafted for performance.
            </p>

            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">18%</span>
                <span className="stat-label">Energy Return</span>
              </div>
              <div className="stat">
                <span className="stat-number">165g</span>
                <span className="stat-label">Ultra Light</span>
              </div>
              <div className="stat">
                <span className="stat-number">4.9★</span>
                <span className="stat-label">Rated</span>
              </div>
            </div>

            <div className="hero-actions">
              <button className="btn-hero-primary" onClick={() => onPageChange('products')}>
                Shop Collection
                <span className="btn-arrow">→</span>
              </button>
              <button className="btn-hero-secondary" onClick={() => onPageChange('products')}>
                Watch Video
                <span className="play-icon">▶</span>
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-container">
              <img 
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" 
                alt="KINETIC STRIDE Performance Shoe"
                className="hero-image"
              />
              <div className="hero-glow"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products Carousel */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <span>BESTSELLERS</span>
            </div>
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">
              Discover our most popular performance footwear, trusted by athletes worldwide
            </p>
          </div>

          <div className="carousel-container">
            <button 
              className="carousel-btn carousel-btn-prev" 
              onClick={() => scrollCarousel('left')}
              aria-label="Previous products"
            >
              ←
            </button>

            <div className="carousel-track" ref={carouselRef}>
              {featuredProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="product-card-featured"
                  onClick={() => onPageChange('products')}
                >
                  <div className={`product-badge badge-${product.badgeColor}`}>
                    {product.badge}
                  </div>
                  
                  <div className="product-image-wrapper">
                    <img src={product.image} alt={product.name} className="product-image" />
                    <div className="product-overlay">
                      <button className="btn-quick-view">
                        Quick View
                      </button>
                    </div>
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-rating">
                      <div className="stars">★★★★★</div>
                      <span className="rating-count">(124)</span>
                    </div>
                    <div className="product-price">
                      <span className="current-price">${product.price.toFixed(2)}</span>
                      {product.originalPrice && (
                        <span className="original-price">${product.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="carousel-btn carousel-btn-next" 
              onClick={() => scrollCarousel('right')}
              aria-label="Next products"
            >
              →
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">
              Find the perfect footwear for your performance needs
            </p>
          </div>

          <div className="categories-grid">
            <div className="category-card large" onClick={() => onPageChange('men')}>
              <div className="category-image">
                <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" alt="Men's Performance Shoes" />
                <div className="category-overlay">
                  <div className="category-content">
                    <h3 className="category-title">Men's Collection</h3>
                    <p className="category-description">Engineered for power and speed</p>
                    <span className="category-count">120+ Styles</span>
                    <button className="btn-category">Shop Men's</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="category-card large" onClick={() => onPageChange('women')}>
              <div className="category-image">
                <img src="https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800" alt="Women's Performance Shoes" />
                <div className="category-overlay">
                  <div className="category-content">
                    <h3 className="category-title">Women's Collection</h3>
                    <p className="category-description">Designed for precision and agility</p>
                    <span className="category-count">95+ Styles</span>
                    <button className="btn-category">Shop Women's</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="category-card small" onClick={() => onPageChange('products')}>
              <div className="category-image">
                <img src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400" alt="New Arrivals" />
                <div className="category-overlay">
                  <div className="category-content">
                    <h3 className="category-title">New Arrivals</h3>
                    <button className="btn-category-small">Shop Now</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="category-card small" onClick={() => onPageChange('products')}>
              <div className="category-image">
                <img src="https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400" alt="Sale Items" />
                <div className="category-overlay">
                  <div className="category-content">
                    <h3 className="category-title">Sale</h3>
                    <span className="sale-badge">Up to 40% Off</span>
                    <button className="btn-category-small">Shop Sale</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🚚</div>
              <h3 className="feature-title">Free Shipping</h3>
              <p className="feature-description">Free delivery on orders over $180</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">↩️</div>
              <h3 className="feature-title">Easy Returns</h3>
              <p className="feature-description">30-day hassle-free returns</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Secure Payment</h3>
              <p className="feature-description">Your data is always protected</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Performance Tested</h3>
              <p className="feature-description">Lab-verified technology</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <h2 className="newsletter-title">Stay Ahead of the Game</h2>
            <p className="newsletter-description">
              Be the first to know about new releases, exclusive offers, and performance tips
            </p>
            <div className="newsletter-form">
              <input 
                type="email" 
                className="newsletter-input"
                placeholder="Enter your email address"
              />
              <button className="newsletter-btn">Subscribe</button>
            </div>
            <p className="newsletter-disclaimer">
              By subscribing, you agree to receive marketing emails. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="trust-section">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <span className="trust-number">50K+</span>
              <span className="trust-label">Happy Athletes</span>
            </div>
            <div className="trust-item">
              <span className="trust-number">98%</span>
              <span className="trust-label">Satisfaction Rate</span>
            </div>
            <div className="trust-item">
              <span className="trust-number">120+</span>
              <span className="trust-label">Countries Shipped</span>
            </div>
            <div className="trust-item">
              <span className="trust-number">4.9★</span>
              <span className="trust-label">Average Rating</span>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

export default HomePage;

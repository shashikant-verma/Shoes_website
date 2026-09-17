import React, { useRef, useEffect, useState } from 'react';
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
      badge: 'LAB VERIFIED',
      badgeColor: 'tertiary'
    },
    {
      id: 'p5',
      name: 'AURORA SPRINT',
      image: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600',
      price: 265.00,
      badge: 'BEST SELLER',
      badgeColor: 'primary'
    },
    {
      id: 'p3',
      name: 'VELOCITY ZERO',
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600',
      price: 425.00,
      badge: 'COMPETITION',
      badgeColor: 'primary'
    },
    {
      id: 'p7',
      name: 'VORTEX ELITE',
      image: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=600',
      price: 385.00,
      badge: 'PRO SERIES',
      badgeColor: 'tertiary'
    },
    {
      id: 'p2',
      name: 'AI JONDAR PRO',
      image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
      price: 325.00,
      badge: 'ELITE',
      badgeColor: 'secondary'
    },
    {
      id: 'p8',
      name: 'THUNDER TRAIL',
      image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600',
      price: 310.00,
      badge: 'TRAIL BEAST',
      badgeColor: 'secondary'
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
        <div className="hero-content">
          <div className="telemetry-badge">
            <span className="status-dot pulse-glow"></span>
            <span className="telemetry-label">BIOMECHANICAL ENGINEERING</span>
          </div>
          
          <h1 className="hero-title">
            <span className="display-xl gradient-text">PROPULSION</span>
            <span className="headline-lg">UNBOUND</span>
          </h1>
          
          <p className="hero-quote body-lg">
            Ultra-compressed carbon-plate geometries engineered for maximum ground force amplification. 
            Lab-validated velocity gains across 5K to marathon distances.
          </p>

          <div className="hero-metrics">
            <div className="metric-item">
              <span className="metric-value">14.8%</span>
              <span className="metric-label">ENERGY RETURN</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-value">179g</span>
              <span className="metric-label">WEIGHT</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-value">3.2mm</span>
              <span className="metric-label">DROP</span>
            </div>
          </div>

          <div className="hero-actions">
            <button className="btn-primary" onClick={() => onPageChange('products')}>
              <span>EXPLORE COLLECTION</span>
              <span className="btn-icon">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Section */}
      <section className="carousel-section">
        <div className="carousel-header">
          <div className="telemetry-badge">
            <span className="status-dot pulse-glow"></span>
            <span className="telemetry-label">FEATURED COLLECTION</span>
          </div>
          <h2 className="section-title headline-lg">TRENDING NOW</h2>
          <p className="section-subtitle body-md">
            Discover our most sought-after performance footwear
          </p>
        </div>

        <div className="carousel-container">
          <button 
            className="carousel-nav carousel-nav-left" 
            onClick={() => scrollCarousel('left')}
            aria-label="Scroll left"
          >
            ‹
          </button>

          <div className="carousel-track" ref={carouselRef}>
            {featuredProducts.map((product, index) => (
              <div 
                key={product.id} 
                className="carousel-card"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => onPageChange('products')}
              >
                <div className={`carousel-badge badge-${product.badgeColor}`}>
                  <span className="telemetry-label">{product.badge}</span>
                </div>
                <div className="carousel-image-wrapper">
                  <img src={product.image} alt={product.name} className="carousel-image" />
                  <div className="carousel-overlay">
                    <button className="btn-view-quick">
                      VIEW DETAILS →
                    </button>
                  </div>
                </div>
                <div className="carousel-info">
                  <h3 className="carousel-title">{product.name}</h3>
                  <p className="carousel-price">${product.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <button 
            className="carousel-nav carousel-nav-right" 
            onClick={() => scrollCarousel('right')}
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-box">
              <div className="feature-icon">⚡</div>
              <h3 className="headline-md">PREMIUM MATERIALS</h3>
              <p className="body-sm">Advanced carbon-fiber plates and responsive foam technology</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">🔬</div>
              <h3 className="headline-md">LAB TESTED</h3>
              <p className="body-sm">Rigorously tested for performance and durability</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">🚀</div>
              <h3 className="headline-md">ENERGY RETURN</h3>
              <p className="body-sm">Up to 18% energy return for maximum propulsion</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">✓</div>
              <h3 className="headline-md">30-DAY WARRANTY</h3>
              <p className="body-sm">Risk-free returns and exchanges guaranteed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title headline-lg">SHOP BY CATEGORY</h2>
          
          <div className="categories-grid">
            <div className="category-card" onClick={() => onPageChange('men')}>
              <div className="category-image">
                <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600" alt="Men's Shoes" />
              </div>
              <div className="category-info">
                <h3 className="headline-md">MEN'S</h3>
                <p className="body-sm">Performance engineered for power</p>
                <button className="btn-category">
                  SHOP NOW →
                </button>
              </div>
            </div>

            <div className="category-card" onClick={() => onPageChange('women')}>
              <div className="category-image">
                <img src="https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600" alt="Women's Shoes" />
              </div>
              <div className="category-info">
                <h3 className="headline-md">WOMEN'S</h3>
                <p className="body-sm">Designed for velocity and precision</p>
                <button className="btn-category">
                  SHOP NOW →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number gradient-text">50K+</span>
              <span className="stat-label telemetry-label">ATHLETES TRUST US</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number gradient-text">98%</span>
              <span className="stat-label telemetry-label">SATISFACTION RATE</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number gradient-text">120+</span>
              <span className="stat-label telemetry-label">COUNTRIES SHIPPED</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number gradient-text">4.9★</span>
              <span className="stat-label telemetry-label">AVERAGE RATING</span>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

export default HomePage;

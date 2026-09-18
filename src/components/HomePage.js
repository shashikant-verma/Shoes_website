import React, { useEffect, useRef, useState } from 'react';
import './HomePage.css';
import productService from '../services/productService';
import ProductSkeleton from './ProductSkeleton';

function HomePage({ onPageChange }) {
  const carouselRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadFeaturedProducts = async () => {
      const result = await productService.getProducts({
        status: 'active',
        featured: true,
        limit: 6
      });

      if (isMounted && result.success) {
        setFeaturedProducts(result.data.data.map((product) => ({
          ...product,
          id: product._id,
          badge: product.badge || 'FEATURED',
          badgeColor: product.badgeColor || 'primary',
          rating: product.rating || 0,
          reviews: product.reviewCount || 0
        })));
      } else if (isMounted) {
        setFeaturedError(true);
      }

      if (isMounted) setFeaturedLoading(false);
    };

    loadFeaturedProducts();
    return () => { isMounted = false; };
  }, []);

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
              <span>THE NEW SEASON</span>
            </div>
            
            <h1 className="hero-title">
              <span className="hero-subtitle">Step into your everyday</span>
              <span className="hero-main">STEP INTO</span>
              <span className="hero-accent">YOUR VIBE</span>
            </h1>
            
            <p className="hero-description">
              Signature sneakers and everyday essentials designed to move with your style.
              Find your next pair in the SoleVibe edit.
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
              <button className="btn-hero-primary" onClick={() => onPageChange('men')}>
                Shop Men
                <span className="btn-arrow">→</span>
              </button>
              <button className="btn-hero-secondary" onClick={() => onPageChange('women')}>
                Shop Women
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-container">
              <img 
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" 
                alt="SoleVibe Performance Shoe"
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
              <span>THE SOLEVIBE EDIT</span>
            </div>
            <h2 className="section-title">Fresh steps, considered details</h2>
            <p className="section-subtitle">
              A refined edit of pairs made for daily plans, late nights, and everything between.
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
              {featuredLoading && [1, 2, 3].map((item) => <ProductSkeleton key={item} />)}
              {!featuredLoading && !featuredError && featuredProducts.map((product, index) => (
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
                      <div className="stars">{'★'.repeat(Math.floor(product.rating || 0))}{'☆'.repeat(Math.max(0, 5 - Math.floor(product.rating || 0)))}</div>
                      <span className="rating-count">({product.reviews || 0})</span>
                    </div>
                    <div className="product-price">
                      <span className="current-price">₹{Number(product.price || 0).toLocaleString()}</span>
                      {product.originalPrice && (
                        <>
                          <span className="original-price">₹{Number(product.originalPrice).toLocaleString()}</span>
                          <span className="discount-badge">{product.discount}% OFF</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!featuredLoading && featuredError && (
                <div className="featured-empty-state">
                  <strong>Featured products are temporarily unavailable.</strong>
                  <span>Browse the full catalog to continue shopping.</span>
                  <button className="newsletter-btn" onClick={() => onPageChange('products')}>Shop all footwear</button>
                </div>
              )}
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
            <h2 className="section-title">Find your pair</h2>
            <p className="section-subtitle">
              Explore understated classics and standout colour for every wardrobe.
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

            <div className="category-card small" onClick={() => onPageChange('new-arrivals')}>
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

            <div className="category-card small" onClick={() => onPageChange('sale')}>
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
            <h2 className="newsletter-title">The SoleVibe edit</h2>
            <p className="newsletter-description">
              Explore considered footwear, seasonal colour, and everyday pairs selected for your rotation.
            </p>
            <div className="newsletter-form">
              <button className="newsletter-btn" onClick={() => onPageChange('products')}>
                Shop all footwear
              </button>
            </div>
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

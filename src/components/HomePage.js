import React, { useEffect, useState } from 'react';
import './HomePage.css';
import productService from '../services/productService';
import reviewService from '../services/reviewService';
import newsletterService from '../services/newsletterService';
import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';
import Hero3D from './Hero3D';

function HomePage({ 
  onPageChange, 
  onProductClick, 
  wishlist = [], 
  onToggleWishlist, 
  onQuickView 
}) {
  // State for dynamic products and reviews fetched from MongoDB
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  
  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState(''); // 'success' | 'error' | ''
  const [newsletterMessage, setNewsletterMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCatalogData = async () => {
      try {
        // 1. Fetch featured products from MongoDB
        const featuredRes = await productService.getProducts({
          status: 'active',
          featured: true,
          limit: 6
        });

        // 2. Fetch new arrivals sorted by newest
        const newRes = await productService.getProducts({
          status: 'active',
          sort: '-createdAt',
          limit: 4
        });

        // 3. Fetch general catalog to populate best sellers
        const catalogRes = await productService.getProducts({
          status: 'active',
          limit: 12
        });

        // 4. Fetch approved customer reviews from MongoDB
        const reviewsRes = await reviewService.getApprovedReviews(6);

        if (isMounted) {
          const featuredList = (featuredRes?.data?.data || []).map(p => ({ ...p, id: p._id }));
          const newList = (newRes?.data?.data || []).map(p => ({ ...p, id: p._id, badge: 'NEW RELEASE' }));
          const allList = (catalogRes?.data?.data || []).map(p => ({ ...p, id: p._id }));

          setFeaturedProducts(featuredList.length > 0 ? featuredList : allList.slice(0, 4));
          setNewArrivals(newList.length > 0 ? newList : allList.slice(4, 8));
          
          // Strict filter: require both BEST badge and verified rating >= 4.3
          const bestSellerCandidates = allList.filter(p => 
            p.badge?.includes('BEST') && Number(p.rating || 0) >= 4.3
          );
          setBestSellers(
            bestSellerCandidates.length >= 4 
              ? bestSellerCandidates.slice(0, 4) 
              : allList.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4)
          );

          if (reviewsRes && reviewsRes.success && Array.isArray(reviewsRes.data)) {
            setApprovedReviews(reviewsRes.data);
          }
          setReviewsLoading(false);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading homepage catalog data:', err);
        if (isMounted) {
          setLoading(false);
          setReviewsLoading(false);
        }
      }
    };

    loadCatalogData();
    return () => { isMounted = false; };
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterStatus('error');
      setNewsletterMessage('Please enter a valid email address.');
      return;
    }

    setNewsletterLoading(true);
    setNewsletterStatus('');
    setNewsletterMessage('');

    try {
      const res = await newsletterService.subscribe({
        email: newsletterEmail.trim(),
        source: 'homepage'
      });

      setNewsletterLoading(false);
      if (res && res.success) {
        setNewsletterStatus('success');
        setNewsletterMessage(res.message || 'You are on the roster. Watch your inbox for upcoming updates.');
        setTimeout(() => {
          setNewsletterEmail('');
        }, 4000);
      } else {
        setNewsletterStatus('error');
        setNewsletterMessage(res?.message || 'Unable to complete subscription. Please try again.');
      }
    } catch (err) {
      setNewsletterLoading(false);
      setNewsletterStatus('error');
      setNewsletterMessage('Network error processing subscription. Please check your connection.');
    }
  };

  const handleProductCardClick = (product) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      window.dispatchEvent(new CustomEvent('openProductDetail', { detail: product }));
    }
  };

  const handleDisciplineKeyDown = (page, e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPageChange(page);
    }
  };

  return (
    <div className="home-page">
      {/* 1. Value Proposition Utility Ticker */}
      <section className="home-utility-ticker" aria-label="Store Benefits">
        <div className="container">
          <div className="utility-ticker-grid">
            <div className="ticker-item">
              <span className="ticker-icon" aria-hidden="true">⚡</span>
              <span className="ticker-text">RESPONSIVE CUSHIONING & SUPPORT</span>
            </div>
            <div className="ticker-item">
              <span className="ticker-icon" aria-hidden="true">🚚</span>
              <span className="ticker-text">FREE STANDARD SHIPPING OVER ₹15,000</span>
            </div>
            <div className="ticker-item">
              <span className="ticker-icon" aria-hidden="true">🔄</span>
              <span className="ticker-text">EASY 7-DAY RETURN POLICY</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. High-Impact Editorial Hero Section */}
      <section className="home-hero-container">
        <Hero3D onExplore={(page) => onPageChange(page || 'shop')} />
      </section>

      {/* 3. Featured Footwear Categories */}
      <section className="home-section categories-curated-section" aria-label="Footwear Collections">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="telemetry-label section-eyebrow">MOVEMENT DISCIPLINES</span>
              <h2 className="headline-lg section-heading">DISCIPLINE-DRIVEN FOOTWEAR</h2>
            </div>
            <button 
              type="button" 
              onClick={() => onPageChange('shop')} 
              className="btn-link-action"
              aria-label="View all footwear collections"
            >
              <span>View All Collections</span>
              <span className="arrow-icon" aria-hidden="true">→</span>
            </button>
          </div>

          <div className="category-cards-grid">
            {/* Category 1: Road Running */}
            <div 
              className="discipline-card" 
              onClick={() => onPageChange('running')}
              onKeyDown={(e) => handleDisciplineKeyDown('running', e)}
              role="button"
              tabIndex={0}
              aria-label="Explore Road Running collection"
            >
              <div className="discipline-img-wrap">
                <img 
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80" 
                  alt="Road Running" 
                  className="discipline-img"
                  loading="lazy"
                />
                <div className="discipline-badge">
                  <span className="telemetry-label">ROAD RUNNING</span>
                </div>
              </div>
              <div className="discipline-info">
                <h3 className="headline-sm discipline-title">ROAD RUNNING</h3>
                <p className="body-sm discipline-desc">
                  Cushioned midsole geometries engineered for daily tempo and high-cadence distance.
                </p>
                <span className="discipline-cta">EXPLORE ROAD →</span>
              </div>
            </div>

            {/* Category 2: Trail & Alpine */}
            <div 
              className="discipline-card" 
              onClick={() => onPageChange('trail')}
              onKeyDown={(e) => handleDisciplineKeyDown('trail', e)}
              role="button"
              tabIndex={0}
              aria-label="Explore Trail and Outdoor collection"
            >
              <div className="discipline-img-wrap">
                <img 
                  src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80" 
                  alt="Trail and Outdoor Footwear" 
                  className="discipline-img"
                  loading="lazy"
                />
                <div className="discipline-badge">
                  <span className="telemetry-label">ALL-TERRAIN</span>
                </div>
              </div>
              <div className="discipline-info">
                <h3 className="headline-sm discipline-title">TRAIL & OUTDOOR</h3>
                <p className="body-sm discipline-desc">
                  Durable all-terrain lug geometry built for confident traction across dirt, gravel, and outdoor paths.
                </p>
                <span className="discipline-cta">EXPLORE TRAIL →</span>
              </div>
            </div>

            {/* Category 3: Racing Lab */}
            <div 
              className="discipline-card" 
              onClick={() => onPageChange('racing')}
              onKeyDown={(e) => handleDisciplineKeyDown('racing', e)}
              role="button"
              tabIndex={0}
              aria-label="Explore Fast Tempo and Racing collection"
            >
              <div className="discipline-img-wrap">
                <img 
                  src="https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80" 
                  alt="Fast Tempo Footwear" 
                  className="discipline-img"
                  loading="lazy"
                />
                <div className="discipline-badge">
                  <span className="telemetry-label">FAST TEMPO</span>
                </div>
              </div>
              <div className="discipline-info">
                <h3 className="headline-sm discipline-title">RACE & TEMPO</h3>
                <p className="body-sm discipline-desc">
                  Ultra-lightweight performance footwear tuned for pace hunting, track intervals, and race day.
                </p>
                <span className="discipline-cta">EXPLORE RACING →</span>
              </div>
            </div>

            {/* Category 4: Daily Rotation */}
            <div 
              className="discipline-card" 
              onClick={() => onPageChange('men')}
              onKeyDown={(e) => handleDisciplineKeyDown('men', e)}
              role="button"
              tabIndex={0}
              aria-label="Explore Daily Lifestyle collection"
            >
              <div className="discipline-img-wrap">
                <img 
                  src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80" 
                  alt="Daily Rotation Footwear" 
                  className="discipline-img"
                  loading="lazy"
                />
                <div className="discipline-badge">
                  <span className="telemetry-label">LIFESTYLE</span>
                </div>
              </div>
              <div className="discipline-info">
                <h3 className="headline-sm discipline-title">DAILY ROTATION</h3>
                <p className="body-sm discipline-desc">
                  Considered craftsmanship paired with lightweight EVA midsole cushioning for all-day comfort.
                </p>
                <span className="discipline-cta">EXPLORE LIFESTYLE →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Trending Performance Drops (Dynamic from MongoDB) */}
      <section className="home-section trending-section" aria-label="Trending Footwear">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="telemetry-label section-eyebrow">FEATURED SELECTION</span>
              <h2 className="headline-lg section-heading">TRENDING ATHLETIC STYLES</h2>
            </div>
            <button 
              type="button" 
              onClick={() => onPageChange('shop')} 
              className="btn-link-action"
              aria-label="Explore all footwear"
            >
              <span>Explore All Shoes</span>
              <span className="arrow-icon" aria-hidden="true">→</span>
            </button>
          </div>

          <div className="product-showcase-grid">
            {loading ? (
              [1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product, idx) => (
                <ProductCard
                  key={product.id || product._id}
                  product={product}
                  index={idx}
                  onProductClick={handleProductCardClick}
                  isInWishlist={wishlist.some(w => (w.id || w._id) === (product.id || product._id))}
                  onToggleWishlist={onToggleWishlist}
                  onQuickView={onQuickView}
                />
              ))
            ) : (
              <p className="body-md empty-state-note">Catalog synchronization in progress...</p>
            )}
          </div>
        </div>
      </section>

      {/* 5. Footwear Engineering Architecture (Honest Engineering Architecture) */}
      <section className="home-section innovation-section" aria-label="Footwear Engineering Architecture">
        <div className="container">
          <div className="innovation-header text-center">
            <span className="telemetry-label section-eyebrow">ENGINEERED EXCELLENCE</span>
            <h2 className="headline-lg innovation-title">FOOTWEAR ENGINEERING ARCHITECTURE</h2>
            <p className="body-md innovation-subtitle">
              Every silhouette is crafted with thoughtful materials, balanced cushioning, and durable construction to keep you moving comfortably.
            </p>
          </div>

          <div className="innovation-grid">
            {/* Tech Pillar 1 */}
            <div className="tech-pillar-card">
              <div className="tech-pillar-header">
                <span className="tech-pill-index">01</span>
                <span className="badge-telemetry">HIGH-REBOUND EVA</span>
              </div>
              <h3 className="headline-sm tech-pillar-title">Multi-Density Midsole Core</h3>
              <p className="body-sm tech-pillar-desc">
                Layered EVA foam cushioning provides effective shock absorption and consistent energy response across everyday training miles.
              </p>
              <div className="tech-telemetry-row">
                <span className="telemetry-label">CUSHIONING:</span>
                <span className="telemetry-metric">RESPONSIVE EVA</span>
              </div>
            </div>

            {/* Tech Pillar 2 */}
            <div className="tech-pillar-card">
              <div className="tech-pillar-header">
                <span className="tech-pill-index">02</span>
                <span className="badge-telemetry">ARCH SUPPORT</span>
              </div>
              <h3 className="headline-sm tech-pillar-title">Balanced Midfoot Architecture</h3>
              <p className="body-sm tech-pillar-desc">
                Reinforced midfoot geometry provides natural arch stability and smooth heel-to-toe gait transitions with zero unnecessary bulk.
              </p>
              <div className="tech-telemetry-row">
                <span className="telemetry-label">STABILITY:</span>
                <span className="telemetry-metric">NEUTRAL ARCH</span>
              </div>
            </div>

            {/* Tech Pillar 3 */}
            <div className="tech-pillar-card">
              <div className="tech-pillar-header">
                <span className="tech-pill-index">03</span>
                <span className="badge-telemetry">VENTILATED UPPER</span>
              </div>
              <h3 className="headline-sm tech-pillar-title">Breathable Engineered Mesh</h3>
              <p className="body-sm tech-pillar-desc">
                Lightweight open-cell mesh promotes continuous airflow while comfortably wrapping the foot for a secure, irritation-free fit.
              </p>
              <div className="tech-telemetry-row">
                <span className="telemetry-label">BREATHABILITY:</span>
                <span className="telemetry-metric">HIGH AIRFLOW</span>
              </div>
            </div>

            {/* Tech Pillar 4 */}
            <div className="tech-pillar-card">
              <div className="tech-pillar-header">
                <span className="tech-pill-index">04</span>
                <span className="badge-telemetry">GEOMETRIC TREAD</span>
              </div>
              <h3 className="headline-sm tech-pillar-title">Multi-Surface Rubber Outsole</h3>
              <p className="body-sm tech-pillar-desc">
                High-abrasion rubber compound with geometric tread patterns delivers confident grip across roads, sidewalks, and turf.
              </p>
              <div className="tech-telemetry-row">
                <span className="telemetry-label">OUTSOLE:</span>
                <span className="telemetry-metric">DURABLE TRACTION</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. New Arrivals Showcase (Dynamic from MongoDB) */}
      <section className="home-section new-arrivals-section" aria-label="New Releases">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="telemetry-label section-eyebrow">JUST IN</span>
              <h2 className="headline-lg section-heading">NEW RELEASES</h2>
            </div>
            <button 
              type="button" 
              onClick={() => onPageChange('new-arrivals')} 
              className="btn-link-action"
              aria-label="Explore all new releases"
            >
              <span>Explore New Releases</span>
              <span className="arrow-icon" aria-hidden="true">→</span>
            </button>
          </div>

          <div className="product-showcase-grid">
            {loading ? (
              [1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)
            ) : newArrivals.length > 0 ? (
              newArrivals.map((product, idx) => (
                <ProductCard
                  key={product.id || product._id}
                  product={product}
                  index={idx}
                  onProductClick={handleProductCardClick}
                  isInWishlist={wishlist.some(w => (w.id || w._id) === (product.id || product._id))}
                  onToggleWishlist={onToggleWishlist}
                  onQuickView={onQuickView}
                />
              ))
            ) : null}
          </div>
        </div>
      </section>

      {/* 7. Lifestyle Campaign Lookbook */}
      <section className="home-section campaign-lookbook-section" aria-label="Lifestyle Campaign">
        <div className="container">
          <div className="lookbook-banner-card">
            <div className="lookbook-visual-column">
              <img 
                src="https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=1000&q=80" 
                alt="SoleVibe Daily Rotation Campaign" 
                className="lookbook-img"
                loading="lazy"
              />
              <div className="lookbook-floating-tag">
                <span className="badge-telemetry">SOLEVIBE PERFORMANCE STUDIO</span>
              </div>
            </div>

            <div className="lookbook-content-column">
              <span className="telemetry-label section-eyebrow">EDITORIAL CAMPAIGN</span>
              <h2 className="display-xl lookbook-title">THE DAILY ROTATION.</h2>
              <p className="body-md lookbook-lead">
                Athletic capability meets understated minimalism. Designed for runners and movers who transition effortlessly between workouts, studio sessions, and city days.
              </p>
              
              <div className="lookbook-specs-list">
                <div className="spec-row">
                  <span className="spec-label">UPPER MATERIAL:</span>
                  <span className="spec-value">Breathable Technical Mesh</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">SOCKLINER:</span>
                  <span className="spec-value">Cushioned Comfort Footbed</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">STANCE GEOMETRY:</span>
                  <span className="spec-value">Neutral All-Day Stance</span>
                </div>
              </div>

              <div className="lookbook-action-row">
                <button 
                  type="button" 
                  onClick={() => onPageChange('women')} 
                  className="btn-primary"
                  aria-label="Shop women's collection"
                >
                  SHOP WOMEN'S EDIT
                </button>
                <button 
                  type="button" 
                  onClick={() => onPageChange('men')} 
                  className="btn-secondary"
                  aria-label="Shop men's collection"
                >
                  SHOP MEN'S EDIT
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Best Sellers Showcase (Filtered Real Products from MongoDB) */}
      {bestSellers.length > 0 && (
        <section className="home-section best-sellers-section" aria-label="Best Selling Footwear">
          <div className="container">
            <div className="section-header-row">
              <div>
                <span className="telemetry-label section-eyebrow">CUSTOMER FAVORITES</span>
                <h2 className="headline-lg section-heading">RUNNER's CHOICE BEST SELLERS</h2>
              </div>
              <button 
                type="button" 
                onClick={() => onPageChange('shop')} 
                className="btn-link-action"
                aria-label="View all best selling shoes"
              >
                <span>View All Pairs</span>
                <span className="arrow-icon" aria-hidden="true">→</span>
              </button>
            </div>

            <div className="product-showcase-grid">
              {bestSellers.map((product, idx) => (
                <ProductCard
                  key={product.id || product._id}
                  product={product}
                  index={idx}
                  onProductClick={handleProductCardClick}
                  isInWishlist={wishlist.some(w => (w.id || w._id) === (product.id || product._id))}
                  onToggleWishlist={onToggleWishlist}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. Verified Customer Reviews (Dynamic from MongoDB) */}
      <section className="home-section testimonials-section" aria-label="Customer Reviews">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="telemetry-label section-eyebrow">VERIFIED REVIEWS</span>
              <h2 className="headline-lg section-heading">COMMUNITY REVIEWS</h2>
            </div>
            <div className="aggregate-rating-badge">
              <span className="star-icon" aria-hidden="true">★★★★★</span>
              <span className="rating-score">APPROVED RUNNER REVIEWS</span>
            </div>
          </div>

          <div className="testimonials-grid">
            {reviewsLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="testimonial-card" style={{ opacity: 0.6 }}>
                  <div className="testimonial-stars">★★★★★</div>
                  <p className="body-md testimonial-text">Loading verified community reviews...</p>
                </div>
              ))
            ) : approvedReviews.length > 0 ? (
              approvedReviews.slice(0, 3).map((rev) => (
                <div key={rev._id} className="testimonial-card">
                  <div className="testimonial-stars" aria-label={`${rev.rating} out of 5 stars`}>
                    {'★'.repeat(Math.round(rev.rating || 5))}
                  </div>
                  <p className="body-md testimonial-text">
                    "{rev.comment || rev.title || 'Great comfort, fit, and support for daily running.'}"
                  </p>
                  <div className="testimonial-footer">
                    <div className="author-info">
                      <span className="author-name">{rev.user?.name || 'Verified Athlete'}</span>
                      <span className="author-role">
                        {rev.isVerifiedPurchase === true ? 'Verified Purchase' : 'Customer Review'}
                      </span>
                    </div>
                    <span className="shoe-tag badge-telemetry">
                      {rev.product?.name ? rev.product.name.replace('SoleVibe ', '') : 'SoleVibe Runner'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="testimonial-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                <p className="body-md" style={{ color: 'var(--text-secondary)' }}>
                  Our verified reviews are being updated. Be the first to review your pair!
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 10. Direct Newsletter Subscription Box */}
      <section className="home-section newsletter-club-section" aria-label="Join SoleVibe Roster">
        <div className="container">
          <div className="newsletter-club-card">
            <span className="telemetry-label section-eyebrow">SOLEVIBE ATHLETE ROSTER</span>
            <h2 className="headline-lg newsletter-club-title">JOIN THE SOLEVIBE MOVEMENT</h2>
            <p className="body-md newsletter-club-desc">
              Subscribe for early access to seasonal product drops, training insights, and member-exclusive events.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="club-form-row">
              <input 
                type="email" 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your runner email address..." 
                className="input-field club-email-input"
                aria-label="Enter your runner email address"
                required
                disabled={newsletterLoading}
              />
              <button 
                type="submit" 
                className="btn-primary club-submit-btn"
                aria-label="Subscribe to SoleVibe newsletter"
                disabled={newsletterLoading}
              >
                <span>{newsletterLoading ? 'SUBSCRIBING…' : 'GET PRIORITY ACCESS'}</span>
                <span className="arrow-icon" aria-hidden="true">→</span>
              </button>
            </form>

            {newsletterMessage && (
              <p 
                className="club-success-note" 
                style={{ color: newsletterStatus === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }}
                role="status"
              >
                {newsletterStatus === 'success' ? '✓ ' : '⚠ '}{newsletterMessage}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;

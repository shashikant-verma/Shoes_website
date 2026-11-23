import React, { useState } from 'react';
import CustomerSupportModal from './CustomerSupportModal';
import newsletterService from '../services/newsletterService';
import './Footer.css';

function Footer({ onPageChange }) {
  const currentYear = new Date().getFullYear();
  const [supportTopic, setSupportTopic] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMsg, setNewsletterMsg] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;

    setNewsletterLoading(true);
    setNewsletterMsg('');

    try {
      const res = await newsletterService.subscribe({
        email: newsletterEmail.trim(),
        source: 'footer'
      });

      setNewsletterLoading(false);
      if (res && res.success) {
        setNewsletterSubscribed(true);
        setNewsletterMsg(res.message || 'Welcome to the SoleVibe athlete roster.');
        setTimeout(() => {
          setNewsletterEmail('');
        }, 3500);
      } else {
        setNewsletterMsg(res?.message || 'Unable to subscribe. Please try again.');
      }
    } catch (err) {
      setNewsletterLoading(false);
      setNewsletterMsg('Subscription error. Please try again later.');
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Top Section */}
        <div className="footer-top">
          <div className="footer-brand">
            <div 
              className="brand-logo" 
              onClick={() => onPageChange && onPageChange('home')}
              style={{ cursor: 'pointer' }}
            >
              <span className="brand-icon">⚡</span>
              <span className="brand-text">SOLE</span>
              <span className="brand-subtitle">VIBE</span>
            </div>
            <p className="body-sm footer-tagline">
              Thoughtfully designed footwear engineered for everyday movement, comfort, and versatile athletic style.
            </p>
            <div className="social-links">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link" 
                aria-label="Instagram"
              >
                <span>IG</span>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link" 
                aria-label="Twitter / X"
              >
                <span>𝕏</span>
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link" 
                aria-label="YouTube"
              >
                <span>YT</span>
              </a>
              <a 
                href="https://strava.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link" 
                aria-label="Strava Running Club"
              >
                <span>ST</span>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h3 className="footer-heading telemetry-label">SHOP COLLECTIONS</h3>
              <ul className="footer-list">
                <li><button type="button" onClick={() => onPageChange && onPageChange('shop')} className="footer-link-btn">All Footwear</button></li>
                <li><button type="button" onClick={() => onPageChange && onPageChange('men')} className="footer-link-btn">Men's Footwear</button></li>
                <li><button type="button" onClick={() => onPageChange && onPageChange('women')} className="footer-link-btn">Women's Footwear</button></li>
                <li><button type="button" onClick={() => onPageChange && onPageChange('running')} className="footer-link-btn">Road Running</button></li>
                <li><button type="button" onClick={() => onPageChange && onPageChange('trail')} className="footer-link-btn">Trail & Alpine</button></li>
                <li><button type="button" onClick={() => onPageChange && onPageChange('sale')} className="footer-link-btn">Sale & Drops</button></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-heading telemetry-label">CUSTOMER CARE</h3>
              <ul className="footer-list">
                <li><button type="button" onClick={() => setSupportTopic('faq')} className="footer-link-btn">Help Center & FAQ</button></li>
                <li><button type="button" onClick={() => setSupportTopic('shipping')} className="footer-link-btn">Shipping & Delivery</button></li>
                <li><button type="button" onClick={() => setSupportTopic('returns')} className="footer-link-btn">7-Day Returns & Exchanges</button></li>
                <li><button type="button" onClick={() => setSupportTopic('contact')} className="footer-link-btn">Contact Concierge</button></li>
                <li><button type="button" onClick={() => onPageChange && onPageChange('orders')} className="footer-link-btn">Track My Order</button></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-heading telemetry-label">EXPLORE</h3>
              <ul className="footer-list">
                <li><button type="button" onClick={() => onPageChange && onPageChange('running')} className="footer-link-btn">Road Running</button></li>
                <li><button type="button" onClick={() => onPageChange && onPageChange('trail')} className="footer-link-btn">Trail & Outdoor</button></li>
                <li><button type="button" onClick={() => onPageChange && onPageChange('shop')} className="footer-link-btn">All Collections</button></li>
                <li><button type="button" onClick={() => setSupportTopic('faq')} className="footer-link-btn">Care & Maintenance</button></li>
                <li><button type="button" onClick={() => setSupportTopic('faq')} className="footer-link-btn">Quality Assurance</button></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-heading telemetry-label">JOIN SOLEVIBE CLUB</h3>
              <p className="body-sm footer-newsletter-text">
                Receive priority updates on new seasonal footwear drops, athletic insights, and member-exclusive offers.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="newsletter-form-footer">
                <div className="newsletter-input-wrap">
                  <input 
                    type="email" 
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="newsletter-input-field" 
                    placeholder="Enter athlete email"
                    aria-label="Enter athlete email address"
                    required
                    disabled={newsletterLoading}
                  />
                  <button 
                    type="submit" 
                    className="newsletter-submit-btn" 
                    aria-label="Subscribe to newsletter"
                    disabled={newsletterLoading}
                  >
                    {newsletterLoading ? '…' : '→'}
                  </button>
                </div>
                {newsletterMsg && (
                  <p className={`newsletter-success-msg ${newsletterSubscribed ? 'success' : 'error'}`} style={{ color: newsletterSubscribed ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {newsletterSubscribed ? '✓ ' : '⚠ '}{newsletterMsg}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p className="telemetry-label copyright-label">
              © {currentYear} SOLEVIBE FOOTWEAR CO. ALL RIGHTS RESERVED.
            </p>
            <div className="footer-legal">
              <button type="button" onClick={() => setSupportTopic('faq')} className="footer-legal-btn">Privacy Policy</button>
              <span className="footer-dot">•</span>
              <button type="button" onClick={() => setSupportTopic('faq')} className="footer-legal-btn">Terms of Service</button>
              <span className="footer-dot">•</span>
              <button type="button" onClick={() => setSupportTopic('shipping')} className="footer-legal-btn">Delivery Terms</button>
            </div>
          </div>

          <div className="footer-bottom-right">
            <div className="payment-methods">
              <span className="telemetry-label secure-badge">SECURE ENCRYPTED CHECKOUT:</span>
              <div className="payment-badges-row">
                <span className="payment-pill-tag">RAZORPAY</span>
                <span className="payment-pill-tag">UPI</span>
                <span className="payment-pill-tag">RUPAY</span>
                <span className="payment-pill-tag">CARDS</span>
                <span className="payment-pill-tag">NETBANKING</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button 
        type="button"
        className="scroll-to-top" 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
      >
        ↑
      </button>

      {/* Customer Support Modal */}
      {supportTopic && (
        <CustomerSupportModal topic={supportTopic} onClose={() => setSupportTopic(null)} />
      )}
    </footer>
  );
}

export default Footer;

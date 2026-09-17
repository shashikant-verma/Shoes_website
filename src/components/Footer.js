import React from 'react';
import './Footer.css';

function Footer({ onPageChange }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Top Section */}
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand-logo">
              <span className="brand-icon">⚡</span>
              <span className="brand-text">KINETIC</span>
            </div>
            <p className="body-sm footer-tagline">
              Ultra-compressed carbon-plate geometries engineered for maximum ground force amplification.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                <span>f</span>
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <span>𝕏</span>
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <span>📷</span>
              </a>
              <a href="#" className="social-link" aria-label="YouTube">
                <span>▶</span>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h3 className="footer-heading telemetry-label">SHOP</h3>
              <ul className="footer-list">
                <li><a href="#" onClick={(e) => { e.preventDefault(); onPageChange && onPageChange('products'); }} className="footer-link">All Shoes</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onPageChange && onPageChange('men'); }} className="footer-link">Men's Shoes</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onPageChange && onPageChange('women'); }} className="footer-link">Women's Shoes</a></li>
                <li><a href="#" className="footer-link">New Releases</a></li>
                <li><a href="#" className="footer-link">Sale</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-heading telemetry-label">SUPPORT</h3>
              <ul className="footer-list">
                <li><a href="#" className="footer-link">Help Center</a></li>
                <li><a href="#" className="footer-link">Size Guide</a></li>
                <li><a href="#" className="footer-link">Shipping Info</a></li>
                <li><a href="#" className="footer-link">Returns & Exchanges</a></li>
                <li><a href="#" className="footer-link">Contact Us</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-heading telemetry-label">COMPANY</h3>
              <ul className="footer-list">
                <li><a href="#" className="footer-link">About Us</a></li>
                <li><a href="#" className="footer-link">Careers</a></li>
                <li><a href="#" className="footer-link">Sustainability</a></li>
                <li><a href="#" className="footer-link">Press</a></li>
                <li><a href="#" className="footer-link">Affiliates</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-heading telemetry-label">NEWSLETTER</h3>
              <p className="body-sm footer-newsletter-text">
                Get the latest updates on new releases and exclusive offers.
              </p>
              <div className="newsletter-form">
                <input 
                  type="email" 
                  className="newsletter-input" 
                  placeholder="Enter your email"
                />
                <button className="btn-newsletter">
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p className="telemetry-label">
              © {currentYear} KINETIC. ALL RIGHTS RESERVED.
            </p>
            <div className="footer-legal">
              <a href="#" className="footer-legal-link">Privacy Policy</a>
              <span className="footer-dot">•</span>
              <a href="#" className="footer-legal-link">Terms of Service</a>
              <span className="footer-dot">•</span>
              <a href="#" className="footer-legal-link">Cookie Policy</a>
            </div>
          </div>

          <div className="footer-bottom-right">
            <div className="payment-methods">
              <span className="telemetry-label">WE ACCEPT:</span>
              <div className="payment-icons">
                <span className="payment-icon">💳</span>
                <span className="payment-icon">🅿️</span>
                <span className="payment-icon">🍎</span>
                <span className="payment-icon">📱</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button 
        className="scroll-to-top" 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
      >
        ↑
      </button>
    </footer>
  );
}

export default Footer;

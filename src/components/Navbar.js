import React, { useState, useEffect } from 'react';
import './Navbar.css';

function Navbar({ currentUser, userType, onLogout, cartCount, wishlistCount, onPageChange, currentPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (page) => {
    onPageChange(page);
    setMenuOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => handleNavClick('home')} style={{ cursor: 'pointer' }}>
          <span className="brand-icon">⚡</span>
          <span className="brand-text">KINETIC</span>
          <span className="brand-slash">{'//'}</span>
        </div>

        <button 
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <button 
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            HOME
          </button>
          <button 
            className={`nav-link ${currentPage === 'products' ? 'active' : ''}`}
            onClick={() => handleNavClick('products')}
          >
            ALL SHOES
          </button>
          <button 
            className={`nav-link ${currentPage === 'products' ? 'active' : ''}`}
            onClick={() => handleNavClick('men')}
          >
            MEN
          </button>
          <button 
            className={`nav-link ${currentPage === 'products' ? 'active' : ''}`}
            onClick={() => handleNavClick('women')}
          >
            WOMEN
          </button>
        </div>

        <div className="navbar-actions">
          {userType === 'user' && (
            <>
              <button className="nav-icon-btn" onClick={() => handleNavClick('wishlist')} title="Wishlist">
                <span className="icon">❤️</span>
                {wishlistCount > 0 && <span className="icon-badge">{wishlistCount}</span>}
              </button>

              <button className="nav-icon-btn" onClick={() => handleNavClick('cart')} title="Cart">
                <span className="icon">🛒</span>
                {cartCount > 0 && <span className="icon-badge">{cartCount}</span>}
              </button>

              <button className="nav-icon-btn" onClick={() => handleNavClick('orders')} title="Orders">
                <span className="icon">📦</span>
              </button>
            </>
          )}
          
          <div className="nav-user">
            <span className="telemetry-label user-name">{currentUser?.name}</span>
            <button className="btn-logout" onClick={onLogout}>
              LOGOUT
            </button>
          </div>
        </div>
      </div>

      {/* Top Alert Bar */}
      <div className="alert-bar">
        <span className="telemetry-label">
          ⚡ FREE EXPRESS SHIPPING ON ORDERS +$180 // 30-DAY RETURNS
        </span>
      </div>
    </nav>
  );
}

export default Navbar;

import React, { useState, useEffect } from 'react';
import './Navbar.css';

function Navbar({ currentUser, userType, onLogout, cartCount, wishlistCount, onPageChange, currentPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
    <>
      {/* Top Announcement Bar */}
      <div className="announcement-bar">
        <div className="announcement-content">
          <span className="announcement-text">
            🚀 NEW COLLECTION LAUNCH: Get 20% OFF with code LAUNCH20 
          </span>
          <span className="announcement-divider">|</span>
          <span className="announcement-text">
            🚚 FREE SHIPPING on orders $180+ 
          </span>
          <span className="announcement-divider">|</span>
          <span className="announcement-text">
            ↩️ Easy 30-Day Returns
          </span>
        </div>
      </div>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Left: Brand */}
          <div className="navbar-left">
            <div className="navbar-brand" onClick={() => handleNavClick('home')} style={{ cursor: 'pointer' }}>
              <span className="brand-icon">⚡</span>
              <span className="brand-text">KINETIC</span>
              <span className="brand-subtitle">STRIDE</span>
            </div>
          </div>

          {/* Center: Navigation Menu */}
          <div className={`navbar-center ${menuOpen ? 'open' : ''}`}>
            <div className="navbar-menu">
              <button 
                className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('home')}
              >
                Home
              </button>
              <div className="nav-dropdown">
                <button 
                  className={`nav-link dropdown-toggle ${currentPage === 'shop' ? 'active' : ''}`}
                  onClick={() => handleNavClick('shop')}
                >
                  Shop
                  <span className="dropdown-arrow">▼</span>
                </button>
                <div className="dropdown-menu">
                  <button onClick={() => handleNavClick('shop')}>All Footwear</button>
                  <button onClick={() => handleNavClick('men')}>Men's Collection</button>
                  <button onClick={() => handleNavClick('women')}>Women's Collection</button>
                  <div className="dropdown-divider"></div>
                  <button onClick={() => handleNavClick('shop')}>New Arrivals</button>
                  <button onClick={() => handleNavClick('shop')}>Best Sellers</button>
                </div>
              </div>
              <button 
                className={`nav-link ${currentPage === 'men' ? 'active' : ''}`}
                onClick={() => handleNavClick('men')}
              >
                Men
              </button>
              <button 
                className={`nav-link ${currentPage === 'women' ? 'active' : ''}`}
                onClick={() => handleNavClick('women')}
              >
                Women
              </button>
              <button 
                className={`nav-link ${currentPage === 'sale' ? 'active' : ''}`}
                onClick={() => handleNavClick('sale')}
              >
                Sale
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="navbar-right">
            {/* Search */}
            <button 
              className="nav-action-btn search-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              title="Search"
            >
              🔍
            </button>

            {userType === 'user' && (
              <>
                {/* Wishlist */}
                <button 
                  className="nav-action-btn wishlist-btn" 
                  onClick={() => handleNavClick('wishlist')} 
                  title="Wishlist"
                >
                  <span className="action-icon">♡</span>
                  {wishlistCount > 0 && <span className="action-badge">{wishlistCount}</span>}
                </button>

                {/* Cart */}
                <button 
                  className="nav-action-btn cart-btn" 
                  onClick={() => handleNavClick('cart')} 
                  title="Shopping Bag"
                >
                  <span className="action-icon">🛍️</span>
                  {cartCount > 0 && <span className="action-badge">{cartCount}</span>}
                </button>
              </>
            )}
            
            {/* User Menu */}
            <div className="nav-user-menu">
              <button className="nav-action-btn user-btn" title="Account">
                👤
              </button>
              <div className="user-dropdown">
                <div className="user-info">
                  <span className="user-name">{currentUser?.name}</span>
                  <span className="user-email">{currentUser?.email}</span>
                </div>
                <div className="user-menu-divider"></div>
                {userType === 'user' && (
                  <button className="user-menu-item" onClick={() => handleNavClick('orders')}>
                    My Orders
                  </button>
                )}
                <button className="user-menu-item" onClick={onLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="navbar-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Search Bar (when opened) */}
        {searchOpen && (
          <div className="navbar-search">
            <div className="search-container">
              <input 
                type="text" 
                className="search-input"
                placeholder="Search for shoes, brands, styles..." 
                autoFocus
              />
              <button className="search-submit">Search</button>
              <button 
                className="search-close"
                onClick={() => setSearchOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export default Navbar;

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
      {/* Top store utility strip */}
      <div className="announcement-bar">
        <div className="announcement-content">
          <span className="announcement-text">
            🎉 FREE SHIPPING ON ORDERS ABOVE ₹15,000
          </span>
          <span className="announcement-divider">|</span>
          <span className="announcement-text">
            EASY 7-DAY RETURNS
          </span>
          <span className="announcement-divider">|</span>
          <span className="announcement-text">
            SECURE PAYMENTS
          </span>
        </div>
      </div>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Left: Brand */}
          <div className="navbar-left">
            <div className="navbar-brand" onClick={() => handleNavClick('home')} style={{ cursor: 'pointer' }}>
              <span className="brand-icon">⚡</span>
              <span className="brand-text">SOLE</span>
              <span className="brand-subtitle">VIBE</span>
            </div>
          </div>

          {/* Center: Navigation Menu */}
          <div className={`navbar-center ${menuOpen ? 'open' : ''}`}>
            <div className="navbar-menu">
              {['men', 'women'].map((category) => (
                <div
                  key={category}
                  className="nav-menu-group"
                >
                  <button
                    className={`nav-link ${currentPage === category ? 'active' : ''}`}
                    onClick={() => handleNavClick(category)}
                    aria-haspopup="true"
                  >
                    {category.toUpperCase()}
                  </button>
                  <div className="mega-menu">
                    <div className="mega-menu-column">
                      <span className="mega-menu-label">SHOP</span>
                      <button onClick={() => handleNavClick('products')}>All Shoes</button>
                      <button onClick={() => handleNavClick(category)}>Everyday Edit</button>
                    </div>
                    <div className="mega-menu-column">
                      <span className="mega-menu-label">COLLECTIONS</span>
                      <button onClick={() => handleNavClick('new-arrivals')}>New Arrivals</button>
                      <button onClick={() => handleNavClick('sale')}>Sale Picks</button>
                    </div>
                    <div className="mega-menu-feature">
                      <span>{category === 'men' ? 'Move your way' : 'Find your everyday pair'}</span>
                      <button onClick={() => handleNavClick(category)}>Shop {category}</button>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                className={`nav-link ${currentPage === 'accessories' ? 'active' : ''}`}
                onClick={() => handleNavClick('accessories')}
              >
                ACCESSORIES
              </button>
              <button 
                className={`nav-link ${currentPage === 'ozark' ? 'active' : ''}`}
                onClick={() => handleNavClick('ozark')}
              >
                OZARK
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
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {userType === 'user' && (
              <>
                {/* Wishlist */}
                <button 
                  className="nav-action-btn wishlist-btn" 
                  onClick={() => handleNavClick('wishlist')} 
                  title="Wishlist"
                  aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ''}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.041 1.5487 8.5C1.5487 9.959 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.9379 22.4518 9.2225 22.4518 8.5C22.4518 7.7775 22.3095 7.0621 22.0329 6.3946C21.7563 5.7272 21.351 5.1208 20.84 4.61Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {wishlistCount > 0 && <span className="action-badge">{wishlistCount}</span>}
                </button>

                {/* Cart */}
                <button 
                  className="nav-action-btn cart-btn" 
                  onClick={() => handleNavClick('cart')} 
                  title="Shopping Bag"
                  aria-label={`Shopping bag${cartCount > 0 ? `, ${cartCount} items` : ''}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 2L3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {cartCount > 0 && <span className="action-badge">{cartCount}</span>}
                </button>
              </>
            )}
            
            {/* User Menu */}
            <div className="nav-user-menu">
              <button className="nav-action-btn user-btn" title="Account" aria-label="Account">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="user-dropdown">
                <div className="user-info">
                  <span className="user-name">{currentUser?.name}</span>
                  <span className="user-email">{currentUser?.email}</span>
                </div>
                <div className="user-menu-divider"></div>
                {userType === 'user' && (
                  <>
                    <button className="user-menu-item" onClick={() => handleNavClick('orders')}>
                      My Orders
                    </button>
                    <button className="user-menu-item" onClick={() => handleNavClick('addresses')}>
                      My Addresses
                    </button>
                  </>
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
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
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
                aria-label="Close search"
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

import React from 'react';
import './MobileBottomNav.css';

function MobileBottomNav({ 
  currentPage, 
  onPageChange, 
  cartCount = 0, 
  wishlistCount = 0, 
  isAuthenticated = false 
}) {
  const isShopActive = [
    'shop', 'men', 'women', 'running', 'training', 'trail', 'ozark', 'accessories', 'new-arrivals', 'sale'
  ].includes(currentPage);
  
  const isAccountActive = ['account', 'orders', 'addresses', 'login'].includes(currentPage);

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation Bar">
      <div className="mobile-bottom-nav-inner">
        {/* Home */}
        <button
          type="button"
          className={`mobile-nav-item ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => onPageChange('home')}
          aria-label="Home"
          aria-current={currentPage === 'home' ? 'page' : undefined}
        >
          <span className="mobile-nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <span className="mobile-nav-label">Home</span>
        </button>

        {/* Shop */}
        <button
          type="button"
          className={`mobile-nav-item ${isShopActive ? 'active' : ''}`}
          onClick={() => onPageChange('shop')}
          aria-label="Shop Catalog"
          aria-current={isShopActive ? 'page' : undefined}
        >
          <span className="mobile-nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </span>
          <span className="mobile-nav-label">Shop</span>
        </button>

        {/* Wishlist */}
        <button
          type="button"
          className={`mobile-nav-item ${currentPage === 'wishlist' ? 'active' : ''}`}
          onClick={() => onPageChange('wishlist')}
          aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ''}`}
          aria-current={currentPage === 'wishlist' ? 'page' : undefined}
        >
          <span className="mobile-nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {wishlistCount > 0 && (
              <span className="mobile-nav-badge" aria-hidden="true">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </span>
          <span className="mobile-nav-label">Wishlist</span>
        </button>

        {/* Bag / Cart */}
        <button
          type="button"
          className={`mobile-nav-item ${currentPage === 'cart' ? 'active' : ''}`}
          onClick={() => onPageChange('cart')}
          aria-label={`Shopping Bag${cartCount > 0 ? `, ${cartCount} items` : ''}`}
          aria-current={currentPage === 'cart' ? 'page' : undefined}
        >
          <span className="mobile-nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {cartCount > 0 && (
              <span className="mobile-nav-badge" aria-hidden="true">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </span>
          <span className="mobile-nav-label">Bag</span>
        </button>

        {/* Account / Sign In */}
        <button
          type="button"
          className={`mobile-nav-item ${isAccountActive ? 'active' : ''}`}
          onClick={() => onPageChange(isAuthenticated ? 'account' : 'login')}
          aria-label={isAuthenticated ? 'My Account' : 'Sign In'}
          aria-current={isAccountActive ? 'page' : undefined}
        >
          <span className="mobile-nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <span className="mobile-nav-label">{isAuthenticated ? 'Account' : 'Sign In'}</span>
        </button>
      </div>
    </nav>
  );
}

export default MobileBottomNav;

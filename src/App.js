import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/design-tokens.css';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ProductShowcase from './components/ProductShowcase';
import CollectionPage from './components/CollectionPage';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import OrderHistory from './components/OrderHistory';
import OrderConfirmation from './components/OrderConfirmation';
import Footer from './components/Footer';
import Toast from './components/Toast';
import ConnectionStatus from './components/ConnectionStatus';
import authService from './services/authService';
import './styles/fashion-overrides.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [cart, setCart] = useState([]);
  const [currentPage, setCurrentPage] = useState('home');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedOrder, setCompletedOrder] = useState(null);
  
  // Toast notification state
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const initializeApp = async () => {
      const path = window.location.pathname;
      setIsAdminRoute(path === '/admin');

      // Check if user is already authenticated
      if (authService.isAuthenticated()) {
        const user = authService.getCurrentUser();
        const userTypeFromStorage = JSON.parse(localStorage.getItem('auth'))?.userType;
        
        // Verify token is still valid
        const profileResult = await authService.getProfile();
        if (profileResult.success) {
          setIsAuthenticated(true);
          setUserType(userTypeFromStorage);
          setCurrentUser(user);
          
          if (userTypeFromStorage === 'user') {
            // FIX 3: Pass isAuthenticatedUser=true explicitly — userType state is not yet set
            loadUserData(user.id, true);
          }
        } else {
          // Token expired or invalid
          authService.clearAuth();
        }
      }
      setLoading(false);
    };

    initializeApp();
  }, []);

  // FIX 3: Accept an explicit isAuthenticatedUser param so we never rely on stale userType state.
  // Called both from initializeApp (where userType state hasn't been set yet) and handleLogin.
  const loadUserData = async (userId, isAuthenticatedUser = false) => {
    // Read any localStorage cart saved under this userId (guest migration)
    let localCart = [];
    const savedCart = localStorage.getItem(`cart-${userId}`);
    if (savedCart) {
      try {
        localCart = JSON.parse(savedCart);
      } catch {
        localCart = [];
      }
    }

    // Also check the generic guest cart key in case the user added items before logging in
    const guestCart = localStorage.getItem('cart-guest');
    if (guestCart) {
      try {
        const guestItems = JSON.parse(guestCart);
        // Merge guest items into localCart (avoid duplicates by product+size)
        guestItems.forEach(guestItem => {
          const exists = localCart.find(
            i => (i.id || i._id) === (guestItem.id || guestItem._id) && i.size === guestItem.size
          );
          if (!exists) {
            localCart.push(guestItem);
          } else {
            exists.quantity = (exists.quantity || 1) + (guestItem.quantity || 1);
          }
        });
      } catch {
        // ignore malformed guest cart
      }
    }

    if (isAuthenticatedUser) {
      // FIX 3: Use the explicit flag — not the stale userType state variable
      try {
        const cartService = require('./services/cartService').default;

        // FIX 3: Migrate any local/guest cart items to MongoDB first
        if (localCart.length > 0) {
          const itemsToSync = localCart
            .filter(item => item.id || item._id) // skip items without a product id
            .map(item => ({
              product: item.id || item._id,
              quantity: item.quantity || 1,
              size: item.size
            }));

          if (itemsToSync.length > 0) {
            await cartService.addToCart(itemsToSync);
          }
          // Remove both localStorage keys after successful migration
          localStorage.removeItem(`cart-${userId}`);
          localStorage.removeItem('cart-guest');
        }

        // Fetch the merged cart from MongoDB
        const cartResult = await cartService.getCart();
        if (cartResult.success && cartResult.data && cartResult.data.data) {
          // FIX 5: Ensure item._id is mapped to cartItemId, product._id to id
          const dbCart = cartResult.data.data.items.map(item => {
            if (!item.product) return null;
            return {
              ...item.product,          // spread product fields (name, price, image, stock…)
              id: item.product._id,     // FIX 5: product._id → id (used as React key & lookup)
              quantity: item.quantity,
              size: item.size,
              cartItemId: item._id      // FIX 5: cart subdoc _id → cartItemId (used by update/remove)
            };
          }).filter(Boolean);
          setCart(dbCart);
        } else {
          // Backend call failed — fall back to local items
          setCart(localCart);
        }
      } catch (error) {
        console.error('Failed to load/sync cart from MongoDB:', error);
        setCart(localCart);
      }
    } else {
      // Guest: set cart directly from localStorage
      setCart(localCart);
    }

    // Load legacy wishlist from localStorage
    const legacyWishlistKey = `wishlist-${userId}`;
    const legacyWishlistStr = localStorage.getItem(legacyWishlistKey);
    let legacyWishlist = [];
    if (legacyWishlistStr) {
      try { legacyWishlist = JSON.parse(legacyWishlistStr); } catch { /* ignore */ }
    }

    // Load guest wishlist
    const guestWishlistStr = localStorage.getItem('wishlist-guest');
    let guestWishlist = [];
    if (guestWishlistStr) {
      try { guestWishlist = JSON.parse(guestWishlistStr); } catch { /* ignore */ }
    }

    if (isAuthenticatedUser) {
      try {
        const wishlistService = require('./services/wishlistService').default;
        
        // Merge strategy: Collect unique product IDs from legacy and guest wishlists
        const productsToSync = new Set();
        [...legacyWishlist, ...guestWishlist].forEach(item => {
          if (item.id || item._id) {
            productsToSync.add(item.id || item._id);
          }
        });

        // Sync local items to MongoDB if any exist
        if (productsToSync.size > 0) {
          for (const productId of productsToSync) {
             await wishlistService.addToWishlist(productId);
          }
          // Clear legacy/guest wishlists from localStorage after successful sync
          localStorage.removeItem(legacyWishlistKey);
          localStorage.removeItem('wishlist-guest');
        }

        // Fetch final merged wishlist from MongoDB
        const wishlistResult = await wishlistService.getWishlist();
        if (wishlistResult.success && wishlistResult.data && wishlistResult.data.items) {
           const dbWishlist = wishlistResult.data.items.map(item => {
             if (!item.product) return null;
             return {
               ...item.product,
               id: item.product._id
             };
           }).filter(Boolean);
           setWishlist(dbWishlist);
        } else {
           setWishlist(legacyWishlist);
        }
      } catch (error) {
        console.error('Failed to load/sync wishlist from MongoDB:', error);
        setWishlist(legacyWishlist);
      }
    } else {
      // Guest: use guest wishlist, fallback to legacy if guest is empty
      setWishlist(guestWishlist.length > 0 ? guestWishlist : legacyWishlist);
    }

    // Load orders from localStorage
    const savedOrders = localStorage.getItem(`orders-${userId}`);
    if (savedOrders) {
      try { setOrders(JSON.parse(savedOrders)); } catch { /* ignore */ }
    }
  };

  const handleLogin = (user, type) => {
    setIsAuthenticated(true);
    setUserType(type);
    setCurrentUser(user);

    if (type === 'user') {
      // FIX 3: Pass isAuthenticatedUser=true explicitly — userType state update is async
      loadUserData(user.id, true);
    }
  };

  const handleLogout = () => {
    authService.clearAuth();
    setIsAuthenticated(false);
    setUserType(null);
    setCurrentUser(null);
    setCart([]);
    setWishlist([]);
    setOrders([]);
    
    if (isAdminRoute) {
      window.location.pathname = '/admin';
    } else {
      window.location.pathname = '/';
    }
  };

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleAddToCart = async (product) => {
    // FIX 2: Guests are allowed. Only block admin accounts.
    if (userType === 'admin') return;

    const itemKey = `${product.id}-${product.size}`;
    const existingItem = cart.find(item => `${item.id}-${item.size}` === itemKey);
    let updatedCart;

    if (existingItem) {
      updatedCart = cart.map(item =>
        `${item.id}-${item.size}` === itemKey
          ? { ...item, quantity: item.quantity + (product.quantity || 1) }
          : item
      );
    } else {
      updatedCart = [...cart, { ...product, quantity: product.quantity || 1 }];
    }

    setCart(updatedCart);

    if (isAuthenticated && userType === 'user') {
      // Authenticated user: sync to MongoDB
      try {
        const cartService = require('./services/cartService').default;
        await cartService.addToCart([{
          product: product.id || product._id,
          quantity: product.quantity || 1,
          size: product.size
        }]);
      } catch (error) {
        console.error('Failed to sync add to cart with MongoDB:', error);
      }
    } else {
      // FIX 2: Guest: persist to localStorage under 'cart-guest'
      localStorage.setItem('cart-guest', JSON.stringify(updatedCart));
    }
    showToast(`Added ${product.name} to cart!`, 'success');
  };

  const handleUpdateCart = async (itemId, newQuantity) => {
    // If it's authenticated, itemId might be the product id or cartItemId.
    // In our map, we set cartItemId.
    const cartItem = cart.find(item => item.id === itemId);
    
    const updatedCart = cart.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    
    if (isAuthenticated && cartItem && cartItem.cartItemId) {
      try {
        const cartService = require('./services/cartService').default;
        await cartService.updateCartItem(cartItem.cartItemId, newQuantity);
      } catch (error) {
        console.error('Failed to update cart item', error);
      }
    } else {
      localStorage.setItem(`cart-${currentUser?.id || 'guest'}`, JSON.stringify(updatedCart));
    }
  };

  const handleRemoveFromCart = async (itemId, itemSize) => {
    const cartItem = cart.find(item => item.id === itemId && item.size === itemSize);
    const updatedCart = cart.filter(item => !(item.id === itemId && item.size === itemSize));
    setCart(updatedCart);
    
    if (isAuthenticated && cartItem && cartItem.cartItemId) {
      try {
        const cartService = require('./services/cartService').default;
        await cartService.removeCartItem(cartItem.cartItemId);
      } catch (error) {
        console.error('Failed to remove cart item', error);
      }
    } else {
      localStorage.setItem(`cart-${currentUser?.id || 'guest'}`, JSON.stringify(updatedCart));
    }
  };

  const handleAddToWishlist = async (product) => {
    // Only block admins from using wishlist
    if (userType === 'admin') return;
    
    const exists = wishlist.find(item => item.id === product.id);
    if (exists) {
      showToast('Already in wishlist!', 'info');
      return;
    }
    
    const updatedWishlist = [...wishlist, product];
    setWishlist(updatedWishlist);
    
    if (isAuthenticated && userType === 'user') {
      try {
        const wishlistService = require('./services/wishlistService').default;
        await wishlistService.addToWishlist(product.id || product._id);
      } catch (error) {
        console.error('Failed to sync add to wishlist with MongoDB:', error);
      }
    } else {
      localStorage.setItem('wishlist-guest', JSON.stringify(updatedWishlist));
    }
    showToast(`Added ${product.name} to wishlist!`, 'success');
  };

  const handleRemoveFromWishlist = async (productId) => {
    const updatedWishlist = wishlist.filter(item => item.id !== productId);
    setWishlist(updatedWishlist);
    
    if (isAuthenticated && userType === 'user') {
      try {
        const wishlistService = require('./services/wishlistService').default;
        await wishlistService.removeFromWishlist(productId);
      } catch (error) {
        console.error('Failed to remove wishlist item from MongoDB', error);
      }
    } else {
      localStorage.setItem('wishlist-guest', JSON.stringify(updatedWishlist));
    }
  };

  const handleOrderComplete = async (order) => {
    // Add order to orders list
    const updatedOrders = [order, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem(`orders-${currentUser.id}`, JSON.stringify(updatedOrders));

    // Clear local cart state and localStorage immediately
    setCart([]);
    localStorage.removeItem(`cart-${currentUser.id}`);
    localStorage.removeItem('cart-guest');

    // FIX 6: Clear MongoDB cart — surface failure visibly, not silently
    if (isAuthenticated && userType === 'user') {
      try {
        const cartService = require('./services/cartService').default;
        const clearResult = await cartService.clearCart();
        if (!clearResult.success) {
          // Log clearly — the cart document on the server was not cleared
          console.error('[Cart] MongoDB cart clear failed after checkout:', clearResult.message);
        }
      } catch (error) {
        console.error('[Cart] MongoDB cart clear threw an exception after checkout:', error);
      }
    }

    // Set completed order and navigate to confirmation
    setCompletedOrder(order);
    setCurrentPage('order-confirmation');
  };

  const handleContinueShopping = () => {
    setCompletedOrder(null);
    setCurrentPage('home');
  };

  const handleViewOrders = () => {
    setCompletedOrder(null);
    setCurrentPage('orders');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (page === 'men') {
      setCategoryFilter('men');
      setCurrentPage('men');
    } else if (page === 'women') {
      setCategoryFilter('women');
      setCurrentPage('women');
    } else if (page === 'sale') {
      setCategoryFilter('all');
      setCurrentPage('sale');
    } else if (page === 'shop') {
      setCategoryFilter('all');
      setCurrentPage('shop');
    } else if (page === 'products') {
      setCategoryFilter('all');
      setCurrentPage('products');
    } else if (page === 'accessories') {
      setCategoryFilter('accessories');
      setCurrentPage('accessories');
    } else if (page === 'ozark') {
      setCategoryFilter('ozark');
      setCurrentPage('ozark');
    } else if (page === 'running') {
      setCategoryFilter('running');
      setCurrentPage('running');
    } else if (page === 'training') {
      setCategoryFilter('training');
      setCurrentPage('training');
    } else if (page === 'trail') {
      setCategoryFilter('trail');
      setCurrentPage('trail');
    } else if (page === 'racing') {
      setCategoryFilter('racing');
      setCurrentPage('racing');
    } else if (page === 'new-arrivals') {
      setCategoryFilter('new');
      setCurrentPage('new-arrivals');
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
  };

  const handleToggleWishlist = (product, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const exists = wishlist.some(item => item.id === product.id);
    if (exists) {
      handleRemoveFromWishlist(product.id);
    } else {
      handleAddToWishlist(product);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner">⚡</div>
          <h2>SOLEVIBE</h2>
          <p>Initializing Application...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} isAdmin={isAdminRoute} />;
  }

  if (userType === 'admin') {
    return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="App">
      <ConnectionStatus />
      <Navbar 
        currentUser={currentUser} 
        userType={userType} 
        onLogout={handleLogout}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        onPageChange={handlePageChange}
        currentPage={currentPage}
      />
      
      {currentPage === 'home' && <HomePage onPageChange={handlePageChange} />}
      
      {currentPage === 'shop' && (
        <CollectionPage 
          title="SHOP"
          subtitle="Explore the complete SoleVibe footwear collection, curated for everyday movement and personal style."
          categoryFilter="all"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      )}
      
      {['products', 'accessories', 'ozark'].includes(currentPage) && (
        <ProductShowcase 
          onAddToCart={handleAddToCart} 
          categoryFilter={categoryFilter}
          onProductClick={handleProductClick}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {currentPage === 'men' && (
        <CollectionPage 
          title="MEN"
          subtitle="A considered edit of men's footwear for everyday movement and personal style."
          categoryFilter="men"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {currentPage === 'women' && (
        <CollectionPage 
          title="WOMEN"
          subtitle="A considered edit of women's footwear for everyday movement and personal style."
          categoryFilter="women"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {currentPage === 'sale' && (
        <CollectionPage 
          title="SALE"
          subtitle="Discover considered pairs and seasonal prices in the SoleVibe sale edit."
          categoryFilter="all"
          saleMode={true}
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {currentPage === 'running' && (
        <CollectionPage 
          title="RUNNING"
          subtitle="Running footwear collection. Engineered for speed, endurance, and peak performance on every run."
          categoryFilter="running"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {currentPage === 'training' && (
        <CollectionPage 
          title="TRAINING"
          subtitle="Training footwear collection. Built for versatility, stability, and power across all workout disciplines."
          categoryFilter="training"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {currentPage === 'trail' && (
        <CollectionPage 
          title="TRAIL"
          subtitle="Trail running collection. Rugged performance footwear designed for off-road adventures and challenging terrain."
          categoryFilter="trail"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {currentPage === 'racing' && (
        <CollectionPage 
          title="RACING"
          subtitle="Racing footwear collection. Ultra-lightweight performance shoes engineered for competition and personal records."
          categoryFilter="racing"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {currentPage === 'new-arrivals' && (
        <CollectionPage 
          title="NEW ARRIVALS"
          subtitle="Meet the newest additions to the SoleVibe footwear collection."
          categoryFilter="new"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      )}
      
      {currentPage === 'cart' && (
        <Cart 
          cart={cart}
          onUpdateCart={handleUpdateCart}
          onRemoveItem={handleRemoveFromCart}
          currentUser={currentUser}
          showToast={showToast}
          onOrderComplete={handleOrderComplete}
        />
      )}

      {currentPage === 'order-confirmation' && (
        <OrderConfirmation
          order={completedOrder}
          onContinueShopping={handleContinueShopping}
          onViewOrders={handleViewOrders}
        />
      )}

      {currentPage === 'wishlist' && (
        <Wishlist
          wishlist={wishlist}
          onRemoveFromWishlist={handleRemoveFromWishlist}
          onProductClick={handleProductClick}
          onAddToCart={handleAddToCart}
        />
      )}

      {currentPage === 'orders' && (
        <OrderHistory orders={orders} />
      )}

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={handleCloseDetail}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
          isInWishlist={wishlist.some(item => item.id === selectedProduct.id)}
        />
      )}

      <Footer onPageChange={handlePageChange} />
      
      {/* Toast Notifications */}
      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={3000}
      />
    </div>
  );
}

export default App;

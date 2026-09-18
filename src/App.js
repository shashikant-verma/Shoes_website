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
import Footer from './components/Footer';
import Toast from './components/Toast';
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
            // Load user-specific data from localStorage
            loadUserData(user.id);
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

  const loadUserData = (userId) => {
    // Load cart from localStorage (temporary storage)
    const savedCart = localStorage.getItem(`cart-${userId}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    
    // Load wishlist from localStorage (temporary storage)
    const savedWishlist = localStorage.getItem(`wishlist-${userId}`);
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }

    // Load orders from localStorage (temporary storage)
    const savedOrders = localStorage.getItem(`orders-${userId}`);
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  };

  const handleLogin = (user, type) => {
    setIsAuthenticated(true);
    setUserType(type);
    setCurrentUser(user);
    
    if (type === 'user') {
      loadUserData(user.id);
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

  const handleAddToCart = (product) => {
    if (userType !== 'user') return;
    
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
    localStorage.setItem(`cart-${currentUser.id}`, JSON.stringify(updatedCart));
    showToast(`Added ${product.name} to cart!`, 'success');
  };

  const handleUpdateCart = (itemId, newQuantity) => {
    const updatedCart = cart.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem(`cart-${currentUser.id}`, JSON.stringify(updatedCart));
  };

  const handleRemoveFromCart = (itemId, itemSize) => {
    const updatedCart = cart.filter(item => !(item.id === itemId && item.size === itemSize));
    setCart(updatedCart);
    localStorage.setItem(`cart-${currentUser.id}`, JSON.stringify(updatedCart));
  };

  const handleAddToWishlist = (product) => {
    if (userType !== 'user') return;
    
    const exists = wishlist.find(item => item.id === product.id);
    if (exists) {
      showToast('Already in wishlist!', 'info');
      return;
    }
    
    const updatedWishlist = [...wishlist, product];
    setWishlist(updatedWishlist);
    localStorage.setItem(`wishlist-${currentUser.id}`, JSON.stringify(updatedWishlist));
    showToast(`Added ${product.name} to wishlist!`, 'success');
  };

  const handleRemoveFromWishlist = (productId) => {
    const updatedWishlist = wishlist.filter(item => item.id !== productId);
    setWishlist(updatedWishlist);
    localStorage.setItem(`wishlist-${currentUser.id}`, JSON.stringify(updatedWishlist));
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
        />
      )}
      
      {['products', 'accessories', 'ozark'].includes(currentPage) && (
        <ProductShowcase 
          onAddToCart={handleAddToCart} 
          categoryFilter={categoryFilter}
          onProductClick={handleProductClick}
        />
      )}

      {currentPage === 'men' && (
        <CollectionPage 
          title="MEN"
          subtitle="A considered edit of men's footwear for everyday movement and personal style."
          categoryFilter="men"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
        />
      )}

      {currentPage === 'women' && (
        <CollectionPage 
          title="WOMEN"
          subtitle="A considered edit of women's footwear for everyday movement and personal style."
          categoryFilter="women"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
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
        />
      )}

      {currentPage === 'running' && (
        <CollectionPage 
          title="RUNNING"
          subtitle="Running footwear collection. Engineered for speed, endurance, and peak performance on every run."
          categoryFilter="running"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
        />
      )}

      {currentPage === 'training' && (
        <CollectionPage 
          title="TRAINING"
          subtitle="Training footwear collection. Built for versatility, stability, and power across all workout disciplines."
          categoryFilter="training"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
        />
      )}

      {currentPage === 'trail' && (
        <CollectionPage 
          title="TRAIL"
          subtitle="Trail running collection. Rugged performance footwear designed for off-road adventures and challenging terrain."
          categoryFilter="trail"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
        />
      )}

      {currentPage === 'racing' && (
        <CollectionPage 
          title="RACING"
          subtitle="Racing footwear collection. Ultra-lightweight performance shoes engineered for competition and personal records."
          categoryFilter="racing"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
        />
      )}

      {currentPage === 'new-arrivals' && (
        <CollectionPage 
          title="NEW ARRIVALS"
          subtitle="Meet the newest additions to the SoleVibe footwear collection."
          categoryFilter="new"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
        />
      )}
      
      {currentPage === 'cart' && (
        <Cart 
          cart={cart}
          onUpdateCart={handleUpdateCart}
          onRemoveItem={handleRemoveFromCart}
          currentUser={currentUser}
          showToast={showToast}
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

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
import authService from './services/authService';

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
    alert('✅ Added to cart!');
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
      alert('Already in wishlist!');
      return;
    }
    
    const updatedWishlist = [...wishlist, product];
    setWishlist(updatedWishlist);
    localStorage.setItem(`wishlist-${currentUser.id}`, JSON.stringify(updatedWishlist));
    alert('❤️ Added to wishlist!');
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
          <h2>KINETIC // STRIDE</h2>
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
          subtitle="Explore the complete KINETIC // STRIDE footwear collection. All footwear designed for running, racing, training and everyday performance."
          categoryFilter="all"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
        />
      )}
      
      {currentPage === 'products' && (
        <ProductShowcase 
          onAddToCart={handleAddToCart} 
          categoryFilter={categoryFilter}
          onProductClick={handleProductClick}
        />
      )}

      {currentPage === 'men' && (
        <CollectionPage 
          title="MEN"
          subtitle="Men's Footwear Collection. Explore performance footwear designed for running, racing, training and everyday movement."
          categoryFilter="men"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
        />
      )}

      {currentPage === 'women' && (
        <CollectionPage 
          title="WOMEN"
          subtitle="Women's Footwear Collection. Explore performance and lifestyle footwear designed for everyday movement."
          categoryFilter="women"
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
        />
      )}

      {currentPage === 'sale' && (
        <CollectionPage 
          title="SALE"
          subtitle="Performance footwear at special prices. Limited time offers on premium athletic shoes."
          categoryFilter="all"
          saleMode={true}
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
    </div>
  );
}

export default App;

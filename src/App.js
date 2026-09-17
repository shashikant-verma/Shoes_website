import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/design-tokens.css';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ProductShowcase from './components/ProductShowcase';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import OrderHistory from './components/OrderHistory';
import Footer from './components/Footer';
import { initializeAdmin, initializeDemoProducts, initializeDemoUser, initializeDemoOrders } from './utils/initializeAdmin';

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

  useEffect(() => {
    initializeAdmin();
    initializeDemoUser();
    initializeDemoProducts();

    const path = window.location.pathname;
    setIsAdminRoute(path === '/admin');

    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      if ((path === '/admin' && authData.userType === 'admin') || 
          (path !== '/admin' && authData.userType === 'user')) {
        setIsAuthenticated(true);
        setUserType(authData.userType);
        setCurrentUser(authData.user);
        
        if (authData.userType === 'user') {
          // Initialize demo orders for user
          initializeDemoOrders(authData.user.id);
          
          const savedCart = localStorage.getItem(`cart-${authData.user.id}`);
          if (savedCart) {
            setCart(JSON.parse(savedCart));
          }
          
          const savedWishlist = localStorage.getItem(`wishlist-${authData.user.id}`);
          if (savedWishlist) {
            setWishlist(JSON.parse(savedWishlist));
          }

          const savedOrders = localStorage.getItem(`orders-${authData.user.id}`);
          if (savedOrders) {
            setOrders(JSON.parse(savedOrders));
          }
        }
      } else {
        localStorage.removeItem('auth');
      }
    }
  }, []);

  const handleLogin = (user, type) => {
    setIsAuthenticated(true);
    setUserType(type);
    setCurrentUser(user);
    localStorage.setItem('auth', JSON.stringify({ userType: type, user }));
    
    if (type === 'user') {
      // Initialize demo orders for user on login
      initializeDemoOrders(user.id);
      
      const savedCart = localStorage.getItem(`cart-${user.id}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      
      const savedWishlist = localStorage.getItem(`wishlist-${user.id}`);
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }

      const savedOrders = localStorage.getItem(`orders-${user.id}`);
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setCurrentUser(null);
    setCart([]);
    setWishlist([]);
    setOrders([]);
    localStorage.removeItem('auth');
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
      setCurrentPage('products');
    } else if (page === 'women') {
      setCategoryFilter('women');
      setCurrentPage('products');
    } else if (page === 'products') {
      setCategoryFilter('all');
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
  };

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
      
      {currentPage === 'products' && (
        <ProductShowcase 
          onAddToCart={handleAddToCart} 
          categoryFilter={categoryFilter}
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

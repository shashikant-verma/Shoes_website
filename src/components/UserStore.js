import React, { useState, useEffect } from 'react';
import './UserStore.css';
import ProductList from './ProductList';
import Cart from './Cart';

function UserStore({ currentUser, onLogout }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadProducts();
    loadCart();
  }, [currentUser]);

  const loadProducts = () => {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem(`cart-${currentUser.id}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCart = (updatedCart) => {
    localStorage.setItem(`cart-${currentUser.id}`, JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const handleAddToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCart(updatedCart);
    } else {
      const updatedCart = [...cart, { ...product, quantity: 1 }];
      saveCart(updatedCart);
    }
    
    alert(`✅ ${product.name} added to cart!`);
  };

  const handleRemoveFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    saveCart(updatedCart);
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity === 0) {
      handleRemoveFromCart(productId);
    } else {
      const updatedCart = cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      saveCart(updatedCart);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    
    alert('🎉 Order placed successfully! Thank you for shopping with ZUXOFIT.');
    saveCart([]);
    setShowCart(false);
  };

  const filteredProducts = filter === 'all'
    ? products
    : products.filter(p => p.category === filter);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="user-store">
      <header className="store-header">
        <div className="store-header-content">
          <div className="header-left">
            <h1>🥾 ZUXOFIT</h1>
            <p>Step into Comfort & Style</p>
          </div>
          
          <nav className="header-nav">
            <button
              className={filter === 'all' ? 'nav-link active' : 'nav-link'}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={filter === 'men' ? 'nav-link active' : 'nav-link'}
              onClick={() => setFilter('men')}
            >
              Men
            </button>
            <button
              className={filter === 'women' ? 'nav-link active' : 'nav-link'}
              onClick={() => setFilter('women')}
            >
              Women
            </button>
          </nav>

          <div className="header-right">
            <button className="btn-cart" onClick={() => setShowCart(true)}>
              🛒 Cart
              {cartItemsCount > 0 && (
                <span className="cart-badge">{cartItemsCount}</span>
              )}
            </button>
            <span className="user-name">👤 {currentUser.name}</span>
            <button className="btn btn-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="store-content">
        <section className="hero-section">
          <div className="hero-content">
            <h2>Men's Originals</h2>
            <h1>A SCANNED SHOE</h1>
            <h1 className="hero-title">ASSET CONNEXIS GO</h1>
            <p>A shoe that activates your fascias and increases your performance.</p>
            <button className="btn btn-primary btn-hero">SHOP NOW</button>
          </div>
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" alt="Featured Shoe" />
          </div>
        </section>

        <section className="products-section">
          <h2 className="section-title">
            {filter === 'all' ? 'All Products' : filter === 'men' ? "Men's Collection" : "Women's Collection"}
            <span className="product-count">({filteredProducts.length})</span>
          </h2>
          <ProductList
            products={filteredProducts}
            onAddToCart={handleAddToCart}
            isAdmin={false}
          />
        </section>
      </main>

      <footer className="store-footer">
        <p>&copy; 2024 ZUXOFIT. All rights reserved. | Step into comfort & style</p>
      </footer>

      {showCart && (
        <Cart
          cart={cart}
          onClose={() => setShowCart(false)}
          onRemove={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}

export default UserStore;

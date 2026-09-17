import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import ProductForm from './ProductForm';
import ProductList from './ProductList';

function AdminDashboard({ currentUser, onLogout }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
  };

  const saveProducts = (updatedProducts) => {
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    setProducts(updatedProducts);
  };

  const handleAddProduct = (product) => {
    const newProduct = {
      ...product,
      id: Date.now().toString()
    };
    const updatedProducts = [...products, newProduct];
    saveProducts(updatedProducts);
    setShowForm(false);
  };

  const handleUpdateProduct = (updatedProduct) => {
    const updatedProducts = products.map(p =>
      p.id === updatedProduct.id ? updatedProduct : p
    );
    saveProducts(updatedProducts);
    setSelectedProduct(null);
    setShowForm(false);
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const updatedProducts = products.filter(p => p.id !== id);
      saveProducts(updatedProducts);
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setSelectedProduct(null);
    setShowForm(false);
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>🥾 ZUXOFIT Admin</h1>
          <span className="admin-badge">Administrator</span>
        </div>
        <div className="admin-header-right">
          <span className="user-name">👤 {currentUser.name}</span>
          <button className="btn btn-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>{products.length}</h3>
              <p>Total Products</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👟</div>
            <div className="stat-info">
              <h3>{products.filter(p => p.category === 'men').length}</h3>
              <p>Men's Shoes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👠</div>
            <div className="stat-info">
              <h3>{products.filter(p => p.category === 'women').length}</h3>
              <p>Women's Shoes</p>
            </div>
          </div>
        </div>

        <div className="admin-actions">
          <button
            className="btn btn-primary btn-add"
            onClick={() => setShowForm(true)}
          >
            ➕ Add New Product
          </button>
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={handleCancelForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <ProductForm
                selectedProduct={selectedProduct}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onCancel={handleCancelForm}
              />
            </div>
          </div>
        )}

        <ProductList
          products={products}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          isAdmin={true}
        />
      </div>
    </div>
  );
}

export default AdminDashboard;

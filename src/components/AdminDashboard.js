import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import ProductForm from './ProductForm';
import ProductList from './ProductList';
import productService from '../services/productService';

function AdminDashboard({ currentUser, onLogout }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    men: 0,
    women: 0,
    active: 0,
    inactive: 0,
    lowStock: 0
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await productService.getProducts({ limit: 100 });
      if (result.success) {
        setProducts(result.data.data);
        calculateStats(result.data.data);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productList) => {
    const stats = {
      total: productList.length,
      men: productList.filter(p => p.category === 'men').length,
      women: productList.filter(p => p.category === 'women').length,
      active: productList.filter(p => p.status === 'active').length,
      inactive: productList.filter(p => p.status === 'inactive').length,
      lowStock: productList.filter(p => p.stock <= 5).length
    };
    setStats(stats);
  };

  const handleAddProduct = async (productData) => {
    try {
      const result = await productService.createProduct(productData);
      if (result.success) {
        await loadProducts(); // Reload products to get updated list
        setShowForm(false);
        alert('✅ Product created successfully!');
      } else {
        alert(`❌ Failed to create product: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('❌ Failed to create product. Please try again.');
    }
  };

  const handleUpdateProduct = async (updatedProduct) => {
    try {
      const result = await productService.updateProduct(updatedProduct._id, updatedProduct);
      if (result.success) {
        await loadProducts(); // Reload products to get updated list
        setSelectedProduct(null);
        setShowForm(false);
        alert('✅ Product updated successfully!');
      } else {
        alert(`❌ Failed to update product: ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('❌ Failed to update product. Please try again.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('⚠️ Are you sure you want to delete this product?\n\nThis action cannot be undone.')) {
      try {
        const result = await productService.deleteProduct(id);
        if (result.success) {
          await loadProducts(); // Reload products to get updated list
          alert('✅ Product deleted successfully!');
        } else {
          alert(`❌ Failed to delete product: ${result.message}`);
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('❌ Failed to delete product. Please try again.');
      }
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

  if (loading) {
    return (
      <div className="admin-dashboard">
        <header className="admin-header">
          <div className="admin-header-left">
            <h1>⚡ KINETIC // STRIDE Admin</h1>
            <span className="admin-badge">Loading...</span>
          </div>
          <div className="admin-header-right">
            <span className="user-name">👤 {currentUser.name}</span>
            <button className="btn btn-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>
        <div className="admin-content">
          <div className="loading-state">
            <div className="loading-spinner">⚡</div>
            <h3>Loading Dashboard...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <header className="admin-header">
          <div className="admin-header-left">
            <h1>⚡ KINETIC // STRIDE Admin</h1>
            <span className="admin-badge">Connection Error</span>
          </div>
          <div className="admin-header-right">
            <span className="user-name">👤 {currentUser.name}</span>
            <button className="btn btn-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>
        <div className="admin-content">
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h3>Connection Error</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadProducts}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>⚡ KINETIC // STRIDE Admin</h1>
          <span className="admin-badge">MongoDB Live</span>
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
              <h3>{stats.total}</h3>
              <p>Total Products</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👟</div>
            <div className="stat-info">
              <h3>{stats.men}</h3>
              <p>Men's Shoes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👠</div>
            <div className="stat-info">
              <h3>{stats.women}</h3>
              <p>Women's Shoes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats.active}</h3>
              <p>Active Products</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <h3>{stats.lowStock}</h3>
              <p>Low Stock</p>
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

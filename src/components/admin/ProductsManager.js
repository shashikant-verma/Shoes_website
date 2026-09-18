import React, { useState, useEffect } from 'react';
import './ProductsManager.css';
import ProductFormModal from './ProductFormModal';
import ConfirmationModal from './ConfirmationModal';
import productService from '../../services/productService';

// Product Management Icons
const ProductIcons = {
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  ),
  Filter: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
    </svg>
  ),
  Add: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  ),
  View: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  ),
  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  ),
  More: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5z"/>
    </svg>
  ),
  Clear: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  )
};

function ProductsManager() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form and Modal States
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    gender: 'all',
    status: 'all',
    stock: 'all'
  });
  
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [products, filters, sortBy, sortOrder]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await productService.getProducts({ limit: 100 });
      if (result.success) {
        setProducts(result.data.data || []);
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

  const applyFiltersAndSort = () => {
    let filtered = [...products];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Apply gender filter
    if (filters.gender !== 'all') {
      filtered = filtered.filter(product => product.gender === filters.gender);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(product => product.status === filters.status);
    }

    // Apply stock filter
    if (filters.stock !== 'all') {
      if (filters.stock === 'low') {
        filtered = filtered.filter(product => product.stock <= 5);
      } else if (filters.stock === 'out') {
        filtered = filtered.filter(product => product.stock === 0);
      } else if (filters.stock === 'in') {
        filtered = filtered.filter(product => product.stock > 0);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'stock':
          aValue = a.stock || 0;
          bValue = b.stock || 0;
          break;
        case 'created':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProducts(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      gender: 'all',
      status: 'all',
      stock: 'all'
    });
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const result = await productService.deleteProduct(productToDelete._id);
      if (result.success) {
        await loadProducts();
        setShowConfirmation(false);
        setProductToDelete(null);
      } else {
        alert(`Failed to delete product: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleProductSaved = async () => {
    await loadProducts();
    setShowProductForm(false);
    setSelectedProduct(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Active', className: 'status-active' },
      inactive: { label: 'Inactive', className: 'status-inactive' },
      discontinued: { label: 'Discontinued', className: 'status-discontinued' }
    };
    
    const config = statusConfig[status] || { label: status, className: 'status-default' };
    return (
      <span className={`status-badge ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getFeaturedBadge = (featured) => {
    if (!featured) return null;
    return <span className="featured-badge">★ Featured</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', className: 'stock-out' };
    if (stock <= 5) return { label: 'Low Stock', className: 'stock-low' };
    return { label: 'In Stock', className: 'stock-good' };
  };

  if (loading) {
    return (
      <div className="products-manager">
        <div className="products-header">
          <h1 className="products-title">Products</h1>
        </div>
        <div className="products-loading">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-manager">
        <div className="products-header">
          <h1 className="products-title">Products</h1>
        </div>
        <div className="products-error">
          <div className="error-icon">⚠️</div>
          <h3>Unable to load products</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadProducts}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="products-manager">
      {/* Header */}
      <div className="products-header">
        <div className="header-left">
          <h1 className="products-title">Products</h1>
          <p className="products-count">{filteredProducts.length} of {products.length} products</p>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={handleAddProduct}>
            <ProductIcons.Add />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="products-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <ProductIcons.Search />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        <div className="toolbar-right">
          <div className="filter-group">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>

            <select
              value={filters.stock}
              onChange={(e) => handleFilterChange('stock', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Stock</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="filter-select"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
              <option value="stock-asc">Stock Low-High</option>
              <option value="stock-desc">Stock High-Low</option>
              <option value="created-desc">Newest First</option>
              <option value="created-asc">Oldest First</option>
            </select>

            {(filters.search || filters.category !== 'all' || filters.status !== 'all' || filters.stock !== 'all') && (
              <button className="btn-clear-filters" onClick={clearFilters}>
                <ProductIcons.Clear />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length > 0 ? (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <tr key={product._id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-image">
                          <img src={product.image} alt={product.name} />
                        </div>
                        <div className="product-info">
                          <div className="product-name">{product.name}</div>
                          <div className="product-brand">{product.brand || 'SoleVibe'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="product-sku">{product.sku || '-'}</span>
                    </td>
                    <td>
                      <span className="product-category">
                        {product.category?.charAt(0).toUpperCase() + product.category?.slice(1) || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="product-price">{formatCurrency(product.price)}</span>
                    </td>
                    <td>
                      <div className="stock-cell">
                        <span className="stock-number">{product.stock}</span>
                        <span className={`stock-status ${stockStatus.className}`}>
                          {stockStatus.label}
                        </span>
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(product.status)}
                    </td>
                    <td>
                      {getFeaturedBadge(product.featured)}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="action-btn action-edit"
                          onClick={() => handleEditProduct(product)}
                          title="Edit Product"
                        >
                          <ProductIcons.Edit />
                        </button>
                        <button
                          className="action-btn action-delete"
                          onClick={() => handleDeleteProduct(product)}
                          title="Delete Product"
                        >
                          <ProductIcons.Delete />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="products-empty">
          <div className="empty-icon">📦</div>
          <h3>No products found</h3>
          <p>
            {filters.search || filters.category !== 'all' || filters.status !== 'all' || filters.stock !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by adding your first product.'}
          </p>
          {(filters.search || filters.category !== 'all' || filters.status !== 'all' || filters.stock !== 'all') && (
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductFormModal
          product={selectedProduct}
          onClose={() => {
            setShowProductForm(false);
            setSelectedProduct(null);
          }}
          onSave={handleProductSaved}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <ConfirmationModal
          title="Delete Product"
          message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowConfirmation(false);
            setProductToDelete(null);
          }}
          type="danger"
        />
      )}
    </div>
  );
}

export default ProductsManager;
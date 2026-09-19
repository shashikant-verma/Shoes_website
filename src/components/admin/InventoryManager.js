import React, { useState, useEffect } from 'react';
import './InventoryManager.css';
import productService from '../../services/productService';

const STOCK_THRESHOLDS = { critical: 3, low: 10, medium: 25 };

function getStockLevel(stock) {
  if (stock === 0) return 'out-of-stock';
  if (stock <= STOCK_THRESHOLDS.critical) return 'critical';
  if (stock <= STOCK_THRESHOLDS.low) return 'low';
  if (stock <= STOCK_THRESHOLDS.medium) return 'medium';
  return 'healthy';
}

function getStockLabel(stock) {
  const level = getStockLevel(stock);
  return {
    'out-of-stock': 'Out of Stock',
    critical: 'Critical',
    low: 'Low',
    medium: 'Medium',
    healthy: 'In Stock'
  }[level];
}

function InventoryManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('stock-asc');
  const [editingStock, setEditingStock] = useState(null); // { id, value }
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await productService.getProducts({ limit: 200 });
      if (result.success) {
        setProducts(result.data.data || []);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStockEdit = (product) => {
    setEditingStock({ id: product._id, value: String(product.stock) });
  };

  const handleStockSave = async (product) => {
    const newStock = parseInt(editingStock.value, 10);
    if (isNaN(newStock) || newStock < 0) {
      showToast('Please enter a valid stock value (0 or above)', 'error');
      return;
    }
    setSaving(product._id);
    try {
      const result = await productService.updateProduct(product._id, { stock: newStock });
      if (result.success) {
        setProducts(prev => prev.map(p => p._id === product._id ? { ...p, stock: newStock } : p));
        showToast(`Stock updated to ${newStock} for "${product.name}"`, 'success');
      } else {
        showToast(result.message || 'Failed to update stock', 'error');
      }
    } catch {
      showToast('Failed to update stock', 'error');
    } finally {
      setSaving(null);
      setEditingStock(null);
    }
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products
    .filter(p => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.name?.toLowerCase().includes(q) && !p.brand?.toLowerCase().includes(q)) return false;
      }
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (stockFilter) {
        const level = getStockLevel(p.stock);
        if (stockFilter === 'out-of-stock' && level !== 'out-of-stock') return false;
        if (stockFilter === 'critical' && !['out-of-stock', 'critical'].includes(level)) return false;
        if (stockFilter === 'low' && !['out-of-stock', 'critical', 'low'].includes(level)) return false;
        if (stockFilter === 'healthy' && level !== 'healthy') return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'stock-asc') return (a.stock || 0) - (b.stock || 0);
      if (sortBy === 'stock-desc') return (b.stock || 0) - (a.stock || 0);
      if (sortBy === 'name') return a.name?.localeCompare(b.name);
      return 0;
    });

  // Inventory summary
  const summary = {
    total: products.length,
    outOfStock: products.filter(p => p.stock === 0).length,
    critical: products.filter(p => getStockLevel(p.stock) === 'critical').length,
    low: products.filter(p => getStockLevel(p.stock) === 'low').length,
    healthy: products.filter(p => getStockLevel(p.stock) === 'healthy').length,
    totalUnits: products.reduce((s, p) => s + (p.stock || 0), 0),
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

  return (
    <div className="inv-page">
      {toast && <div className={`inv-toast inv-toast-${toast.type}`}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}

      {/* Header */}
      <div className="inv-header">
        <div>
          <h1 className="inv-title">Inventory</h1>
          <p className="inv-subtitle">Real-time stock management for {summary.total} products</p>
        </div>
        <button className="inv-refresh-btn" onClick={loadProducts}>↻ Refresh</button>
      </div>

      {/* Summary Stats */}
      <div className="inv-stats">
        <div className="inv-stat">
          <div className="inv-stat-icon">📦</div>
          <div className="inv-stat-val">{summary.total}</div>
          <div className="inv-stat-label">Total Products</div>
        </div>
        <div className="inv-stat inv-stat-alert">
          <div className="inv-stat-icon">🚫</div>
          <div className="inv-stat-val inv-val-danger">{summary.outOfStock}</div>
          <div className="inv-stat-label">Out of Stock</div>
        </div>
        <div className="inv-stat inv-stat-warn">
          <div className="inv-stat-icon">⚠️</div>
          <div className="inv-stat-val inv-val-warn">{summary.critical + summary.low}</div>
          <div className="inv-stat-label">Low / Critical</div>
        </div>
        <div className="inv-stat inv-stat-good">
          <div className="inv-stat-icon">✅</div>
          <div className="inv-stat-val inv-val-good">{summary.healthy}</div>
          <div className="inv-stat-label">Healthy Stock</div>
        </div>
        <div className="inv-stat">
          <div className="inv-stat-icon">🔢</div>
          <div className="inv-stat-val">{summary.totalUnits.toLocaleString()}</div>
          <div className="inv-stat-label">Total Units</div>
        </div>
      </div>

      {/* Filters */}
      <div className="inv-toolbar">
        <div className="inv-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="inv-search-input"
          />
        </div>
        <select className="inv-filter-sel" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
          <option value="">All Stock Levels</option>
          <option value="out-of-stock">Out of Stock</option>
          <option value="critical">Critical (≤ 3)</option>
          <option value="low">Low (≤ 10)</option>
          <option value="healthy">Healthy</option>
        </select>
        <select className="inv-filter-sel" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <select className="inv-filter-sel" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="stock-asc">Stock: Low → High</option>
          <option value="stock-desc">Stock: High → Low</option>
          <option value="name">Name A → Z</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="inv-loading"><div className="inv-spinner"></div><p>Loading inventory...</p></div>
      ) : error ? (
        <div className="inv-error"><span>⚠️</span><h3>{error}</h3><button onClick={loadProducts}>Try Again</button></div>
      ) : filteredProducts.length === 0 ? (
        <div className="inv-empty">
          <div className="inv-empty-icon">📦</div>
          <h3>No products found</h3>
          <p>Try changing your filters.</p>
        </div>
      ) : (
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const level = getStockLevel(product.stock);
                const isEditing = editingStock?.id === product._id;
                return (
                  <tr key={product._id} className={`inv-row ${level === 'out-of-stock' ? 'row-oos' : level === 'critical' ? 'row-critical' : ''}`}>
                    <td>
                      <div className="inv-product-cell">
                        {product.image && <img src={product.image} alt={product.name} className="inv-product-img" />}
                        <div>
                          <div className="inv-product-name">{product.name}</div>
                          <div className="inv-product-brand">{product.brand || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="inv-category">{product.category || '—'}</span></td>
                    <td><span className="inv-price">{formatCurrency(product.price)}</span></td>
                    <td>
                      {isEditing ? (
                        <div className="inv-stock-edit">
                          <input
                            type="number"
                            value={editingStock.value}
                            onChange={e => setEditingStock(p => ({ ...p, value: e.target.value }))}
                            className="inv-stock-input"
                            min="0"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') handleStockSave(product); if (e.key === 'Escape') setEditingStock(null); }}
                          />
                          <button className="inv-save-btn" onClick={() => handleStockSave(product)} disabled={saving === product._id}>
                            {saving === product._id ? '...' : '✓'}
                          </button>
                          <button className="inv-cancel-btn" onClick={() => setEditingStock(null)}>✕</button>
                        </div>
                      ) : (
                        <div className="inv-stock-display">
                          <div className={`inv-stock-bar-wrap`}>
                            <div className={`inv-stock-bar inv-bar-${level}`} style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}></div>
                          </div>
                          <span className={`inv-stock-num inv-num-${level}`}>{product.stock}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`inv-status-badge inv-status-${level}`}>{getStockLabel(product.stock)}</span>
                    </td>
                    <td>
                      {!isEditing && (
                        <button className="inv-edit-btn" onClick={() => handleStockEdit(product)}>
                          ✏️ Edit Stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InventoryManager;

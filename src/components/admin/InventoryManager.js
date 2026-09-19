import React, { useState, useEffect } from 'react';
import './InventoryManager.css';
import inventoryService from '../../services/inventoryService';

function InventoryManager() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalQuantity: 0,
    lowStockThreshold: 5
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('stock');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState(null); // For adjustment modal
  const [adjustChange, setAdjustChange] = useState(1);
  const [adjustMode, setAdjustMode] = useState('add'); // 'add' or 'subtract'
  const [adjustReason, setAdjustReason] = useState('STOCK_IN');
  const [adjustNote, setAdjustNote] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  const [historyProduct, setHistoryProduct] = useState(null); // For history modal
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [toast, setToast] = useState(null);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadInventory();
  }, [currentPage, statusFilter, categoryFilter, sortBy, sortOrder]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchQuery,
        status: statusFilter,
        category: categoryFilter,
        sortBy,
        sortOrder
      };

      const result = await inventoryService.getInventory(params);
      if (result.success && result.data?.data) {
        const payload = result.data.data;
        setProducts(payload.products || []);
        if (payload.pagination) {
          setTotalPages(payload.pagination.totalPages || 1);
        }
        if (payload.summary) {
          setSummary(payload.summary);
        }
        // Collect categories
        if (payload.products) {
          const cats = [...new Set(payload.products.map(p => p.category).filter(Boolean))];
          setCategories(prev => [...new Set([...prev, ...cats])]);
        }
        setError(null);
      } else {
        setError(result.message || 'Failed to load inventory');
        setProducts([]);
      }
    } catch {
      setError('Error connecting to inventory server');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadInventory();
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Open adjustment modal
  const openAdjustmentModal = (product) => {
    setSelectedProduct(product);
    setAdjustMode('add');
    setAdjustChange(1);
    setAdjustReason('STOCK_IN');
    setAdjustNote('');
  };

  // Submit stock adjustment
  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const rawChange = Math.abs(parseInt(adjustChange, 10));
    if (isNaN(rawChange) || rawChange <= 0) {
      showToast('Adjustment quantity must be a positive integer', 'error');
      return;
    }

    const finalChange = adjustMode === 'add' ? rawChange : -rawChange;
    const projectedStock = (selectedProduct.stock || 0) + finalChange;

    if (projectedStock < 0) {
      showToast(`Cannot reduce stock below 0! Current: ${selectedProduct.stock}, Reduction: ${rawChange}`, 'error');
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      const payload = {
        change: finalChange,
        reason: adjustReason,
        note: adjustNote || `Manual stock adjustment (${finalChange > 0 ? '+' : ''}${finalChange})`
      };

      const result = await inventoryService.adjustStock(selectedProduct._id, payload);
      if (result.success && result.data?.data) {
        const updatedProd = result.data.data.product;
        setProducts(prev => prev.map(p => p._id === updatedProd._id ? updatedProd : p));
        showToast(`Stock updated to ${updatedProd.stock} for "${updatedProd.name}"`, 'success');
        setSelectedProduct(null);
        loadInventory(); // Refresh stats
      } else {
        showToast(result.message || 'Failed to update stock', 'error');
      }
    } catch {
      showToast('Error sending stock adjustment request', 'error');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Open inventory history modal
  const openHistoryModal = async (product) => {
    setHistoryProduct(product);
    setLoadingHistory(true);
    setHistoryLogs([]);

    try {
      const result = await inventoryService.getInventoryHistory(product._id);
      if (result.success && result.data?.data) {
        setHistoryLogs(result.data.data || []);
      } else {
        showToast('Failed to fetch transaction history', 'error');
      }
    } catch {
      showToast('Error loading history logs', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusBadge = (stock) => {
    if (stock === 0) return <span className="inv-badge badge-oos">OUT OF STOCK</span>;
    if (stock <= (summary.lowStockThreshold || 5)) return <span className="inv-badge badge-low">LOW STOCK</span>;
    return <span className="inv-badge badge-in">IN STOCK</span>;
  };

  const getTransactionTypeBadge = (type) => {
    const map = {
      STOCK_IN: 'inv-type-in',
      STOCK_OUT: 'inv-type-out',
      ADJUSTMENT: 'inv-type-adj',
      RETURN: 'inv-type-return',
      ORDER: 'inv-type-order',
      DAMAGE: 'inv-type-damage',
      CORRECTION: 'inv-type-correction'
    };
    return <span className={`inv-type-pill ${map[type] || 'inv-type-adj'}`}>{type}</span>;
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="inv-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`inv-toast inv-toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="inv-header">
        <div>
          <h1 className="inv-title">Inventory Management System</h1>
          <p className="inv-subtitle">Authoritative product stock monitoring, adjustment & audit trail</p>
        </div>
        <button className="inv-refresh-btn" onClick={loadInventory}>
          <span>↻</span> Refresh Dashboard
        </button>
      </div>

      {/* Stat Summary Cards */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <div className="inv-stat-icon">📦</div>
          <div>
            <div className="inv-stat-val">{summary.totalProducts}</div>
            <div className="inv-stat-label">Total Products</div>
          </div>
        </div>
        <div className="inv-stat-card card-good">
          <div className="inv-stat-icon">✅</div>
          <div>
            <div className="inv-stat-val val-good">{summary.inStockCount}</div>
            <div className="inv-stat-label">In Stock (&gt; {summary.lowStockThreshold})</div>
          </div>
        </div>
        <div className="inv-stat-card card-warn">
          <div className="inv-stat-icon">⚠️</div>
          <div>
            <div className="inv-stat-val val-warn">{summary.lowStockCount}</div>
            <div className="inv-stat-label">Low Stock (1 - {summary.lowStockThreshold})</div>
          </div>
        </div>
        <div className="inv-stat-card card-danger">
          <div className="inv-stat-icon">🚫</div>
          <div>
            <div className="inv-stat-val val-danger">{summary.outOfStockCount}</div>
            <div className="inv-stat-label">Out of Stock (0)</div>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon">🔢</div>
          <div>
            <div className="inv-stat-val">{summary.totalQuantity.toLocaleString()}</div>
            <div className="inv-stat-label">Total Warehouse Units</div>
          </div>
        </div>
      </div>

      {/* Controls & Filters Toolbar */}
      <div className="inv-toolbar">
        <form className="inv-search-form" onSubmit={handleSearchSubmit}>
          <span className="inv-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by Product Name, SKU, Brand..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="inv-search-input"
          />
          <button type="submit" className="inv-search-btn">Search</button>
        </form>

        <div className="inv-filters-group">
          <select
            className="inv-select"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock (&gt; {summary.lowStockThreshold})</option>
            <option value="LOW_STOCK">Low Stock (1 - {summary.lowStockThreshold})</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
          </select>

          <select
            className="inv-select"
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>

          <select
            className="inv-select"
            value={`${sortBy}-${sortOrder}`}
            onChange={e => {
              const [sb, so] = e.target.value.split('-');
              setSortBy(sb);
              setSortOrder(so);
              setCurrentPage(1);
            }}
          >
            <option value="stock-asc">Stock: Low → High</option>
            <option value="stock-desc">Stock: High → Low</option>
            <option value="name-asc">Name A → Z</option>
            <option value="updatedAt-desc">Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <div className="inv-loading">
          <div className="inv-spinner"></div>
          <p>Loading inventory items...</p>
        </div>
      ) : error ? (
        <div className="inv-error">
          <span>⚠️</span>
          <h3>{error}</h3>
          <button onClick={loadInventory}>Try Again</button>
        </div>
      ) : products.length === 0 ? (
        <div className="inv-empty">
          <div className="inv-empty-icon">📦</div>
          <h3>No matching inventory records found</h3>
          <p>Try resetting filters or adjusting search keywords.</p>
        </div>
      ) : (
        <>
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id} className="inv-row">
                    <td>
                      <div className="inv-prod-cell">
                        {product.image && (
                          <img src={product.image} alt={product.name} className="inv-prod-img" />
                        )}
                        <div>
                          <div className="inv-prod-name">{product.name}</div>
                          <div className="inv-prod-brand">{product.brand || 'SoleVibe'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="inv-sku">{product.sku || 'N/A'}</span></td>
                    <td><span className="inv-cat">{product.category || '—'}</span></td>
                    <td><span className="inv-price">{formatCurrency(product.price)}</span></td>
                    <td>
                      <div className="inv-stock-num">
                        <span className={`inv-qty-pill ${product.stock === 0 ? 'qty-zero' : product.stock <= (summary.lowStockThreshold || 5) ? 'qty-low' : 'qty-ok'}`}>
                          {product.stock} units
                        </span>
                      </div>
                    </td>
                    <td>{getStatusBadge(product.stock)}</td>
                    <td>
                      <div className="inv-actions">
                        <button
                          className="inv-btn-adjust"
                          onClick={() => openAdjustmentModal(product)}
                        >
                          ✏️ Adjust Stock
                        </button>
                        <button
                          className="inv-btn-history"
                          onClick={() => openHistoryModal(product)}
                        >
                          📜 View History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="inv-pagination">
              <button
                className="inv-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ← Prev
              </button>
              <span className="inv-page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="inv-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="inv-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="inv-modal" onClick={e => e.stopPropagation()}>
            <div className="inv-modal-header">
              <div>
                <h2>Adjust Product Stock</h2>
                <p>{selectedProduct.name} • SKU: {selectedProduct.sku || 'N/A'}</p>
              </div>
              <button className="inv-modal-close" onClick={() => setSelectedProduct(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="inv-modal-body">
              <div className="inv-stock-compare-box">
                <div className="compare-item">
                  <span className="compare-label">Current Stock</span>
                  <span className="compare-val">{selectedProduct.stock}</span>
                </div>
                <div className="compare-arrow">➔</div>
                <div className="compare-item">
                  <span className="compare-label">Projected Stock</span>
                  <span className={`compare-val ${
                    (selectedProduct.stock + (adjustMode === 'add' ? Number(adjustChange) : -Number(adjustChange))) < 0
                      ? 'val-invalid'
                      : 'val-projected'
                  }`}>
                    {selectedProduct.stock + (adjustMode === 'add' ? Number(adjustChange) : -Number(adjustChange))}
                  </span>
                </div>
              </div>

              <div className="inv-form-group">
                <label>Adjustment Mode:</label>
                <div className="inv-mode-toggle">
                  <button
                    type="button"
                    className={`mode-btn ${adjustMode === 'add' ? 'active-add' : ''}`}
                    onClick={() => { setAdjustMode('add'); setAdjustReason('STOCK_IN'); }}
                  >
                    ➕ Add Stock (Stock In)
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${adjustMode === 'subtract' ? 'active-sub' : ''}`}
                    onClick={() => { setAdjustMode('subtract'); setAdjustReason('STOCK_OUT'); }}
                  >
                    ➖ Reduce Stock (Stock Out)
                  </button>
                </div>
              </div>

              <div className="inv-form-group">
                <label>Quantity Change:</label>
                <input
                  type="number"
                  min="1"
                  className="inv-modal-input"
                  value={adjustChange}
                  onChange={e => setAdjustChange(e.target.value)}
                  required
                />
              </div>

              <div className="inv-form-group">
                <label>Reason for Adjustment:</label>
                <select
                  className="inv-modal-select"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                >
                  <option value="STOCK_IN">STOCK_IN (New Shipment Received)</option>
                  <option value="STOCK_OUT">STOCK_OUT (Manual Stock Removal)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (General Correction)</option>
                  <option value="DAMAGE">DAMAGE (Damaged / Defective Stock)</option>
                  <option value="CORRECTION">CORRECTION (Audit Correction)</option>
                </select>
              </div>

              <div className="inv-form-group">
                <label>Audit Note / Reference (Optional):</label>
                <input
                  type="text"
                  className="inv-modal-input"
                  placeholder="e.g., Shipment PO #4920 or Warehouse Audit..."
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                />
              </div>

              <div className="inv-modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setSelectedProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={isSubmittingAdjust || (selectedProduct.stock + (adjustMode === 'add' ? Number(adjustChange) : -Number(adjustChange))) < 0}
                >
                  {isSubmittingAdjust ? 'Updating Stock...' : 'Confirm Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyProduct && (
        <div className="inv-modal-overlay" onClick={() => setHistoryProduct(null)}>
          <div className="inv-modal inv-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="inv-modal-header">
              <div>
                <h2>Inventory Transaction History</h2>
                <p>{historyProduct.name} (SKU: {historyProduct.sku || 'N/A'}) • Current Stock: {historyProduct.stock}</p>
              </div>
              <button className="inv-modal-close" onClick={() => setHistoryProduct(null)}>✕</button>
            </div>

            <div className="inv-modal-body">
              {loadingHistory ? (
                <div className="inv-loading">
                  <div className="inv-spinner"></div>
                  <p>Loading history logs...</p>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="inv-empty">
                  <div className="inv-empty-icon">📜</div>
                  <h3>No stock transactions recorded yet</h3>
                  <p>Transactions will appear here when orders are placed, returns are processed, or manual stock adjustments occur.</p>
                </div>
              ) : (
                <div className="inv-history-wrap">
                  <table className="inv-history-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Type</th>
                        <th>Change</th>
                        <th>Before ➔ After</th>
                        <th>Reason / Note</th>
                        <th>Changed By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyLogs.map(log => (
                        <tr key={log._id}>
                          <td><span className="inv-time">{formatDate(log.createdAt)}</span></td>
                          <td>{getTransactionTypeBadge(log.type)}</td>
                          <td>
                            <span className={`inv-change-val ${log.quantity > 0 ? 'pos' : 'neg'}`}>
                              {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                            </span>
                          </td>
                          <td>
                            <span className="inv-stock-flow">
                              {log.previousStock} ➔ <strong>{log.newStock}</strong>
                            </span>
                          </td>
                          <td>
                            <div className="inv-reason">{log.reason}</div>
                            {log.note && <div className="inv-note">{log.note}</div>}
                          </td>
                          <td>
                            <div className="inv-user-name">{log.changedBy?.name || 'System / Admin'}</div>
                            <div className="inv-user-email">{log.changedBy?.email || ''}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryManager;

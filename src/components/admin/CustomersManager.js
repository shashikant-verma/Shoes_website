import React, { useState, useEffect, useCallback } from 'react';
import './CustomersManager.css';
import api from '../../services/api';

function CustomersManager() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [toast, setToast] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const LIMIT = 10;

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit: LIMIT });
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/users?${params.toString()}`);
      const data = response.data;
      setCustomers(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalCustomers(data.total || 0);
      setError(null);
    } catch (err) {
      setError('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadCustomers();
  };

  const handleSelectCustomer = async (customerId) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/users/${customerId}`);
      if (response.data?.success) {
        setSelectedCustomer(response.data.data);
      }
    } catch (err) {
      showToast('Failed to load customer details', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleActive = async (customer) => {
    setUpdatingId(customer._id || customer.id);
    const targetId = customer._id || customer.id;
    try {
      await api.put(`/users/${targetId}/status`, { isActive: !customer.isActive });
      setCustomers(prev => prev.map(c => (c._id === targetId || c.id === targetId) ? { ...c, isActive: !c.isActive } : c));
      if (selectedCustomer && (selectedCustomer._id === targetId || selectedCustomer.id === targetId)) {
        setSelectedCustomer(prev => ({ ...prev, isActive: !prev.isActive }));
      }
      showToast(`Customer ${!customer.isActive ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update customer status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (customer, newRole) => {
    const targetId = customer._id || customer.id;
    setUpdatingId(targetId);
    try {
      await api.put(`/users/${targetId}`, { role: newRole });
      setCustomers(prev => prev.map(c => (c._id === targetId || c.id === targetId) ? { ...c, role: newRole } : c));
      if (selectedCustomer && (selectedCustomer._id === targetId || selectedCustomer.id === targetId)) {
        setSelectedCustomer(prev => ({ ...prev, role: newRole }));
      }
      showToast('Role updated successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update role', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const getInitials = (name) => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const getAvatarColor = (name) => {
    const colors = ['#c9232d', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    let hash = 0;
    for (let c of (name || '')) hash = c.charCodeAt(0) + hash * 31;
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="cm-page">
      {toast && (
        <div className={`cm-toast cm-toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="cm-header">
        <div>
          <h1 className="cm-title">Customers Management</h1>
          <p className="cm-subtitle">{totalCustomers} registered account{totalCustomers !== 1 ? 's' : ''}</p>
        </div>
        <button className="cm-refresh-btn" onClick={loadCustomers}>↻ Refresh</button>
      </div>

      {/* Stats Bar */}
      <div className="cm-stats-bar">
        <div className="cm-stat">
          <div className="cm-stat-value">{totalCustomers}</div>
          <div className="cm-stat-label">Total Customers</div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-value">{customers.filter(c => c.isActive).length}</div>
          <div className="cm-stat-label">Active (Loaded)</div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-value">{customers.filter(c => c.role === 'ADMIN').length}</div>
          <div className="cm-stat-label">Admins (Loaded)</div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-value">{customers.filter(c => !c.isActive).length}</div>
          <div className="cm-stat-label">Inactive (Loaded)</div>
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="cm-toolbar">
        <form className="cm-search" onSubmit={handleSearchSubmit}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by customer name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="cm-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="cm-clear-search"
              onClick={() => { setSearchQuery(''); setCurrentPage(1); loadCustomers(); }}
            >
              ✕
            </button>
          )}
        </form>

        <select
          className="cm-role-select"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="USER">Users</option>
          <option value="ADMIN">Admins</option>
        </select>

        <select
          className="cm-role-select"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="cm-loading">
          <div className="cm-spinner"></div>
          <p>Loading customers data...</p>
        </div>
      ) : error ? (
        <div className="cm-error">
          <span>⚠️</span>
          <h3>{error}</h3>
          <button onClick={loadCustomers}>Try Again</button>
        </div>
      ) : customers.length === 0 ? (
        <div className="cm-empty">
          <div className="cm-empty-icon">👥</div>
          <h3>No customers found</h3>
          <p>{searchQuery ? 'Try a different search term.' : 'No customers match the selected filter.'}</p>
        </div>
      ) : (
        <>
          <div className="cm-table-wrap">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer._id || customer.id} className="cm-row" onClick={() => handleSelectCustomer(customer._id || customer.id)}>
                    <td>
                      <div className="cm-customer-cell">
                        <div className="cm-avatar" style={{ background: getAvatarColor(customer.name) }}>
                          {getInitials(customer.name)}
                        </div>
                        <div>
                          <div className="cm-name">{customer.name}</div>
                          <div className="cm-email">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        className={`cm-role-badge ${customer.role === 'ADMIN' ? 'role-admin' : 'role-user'}`}
                        value={customer.role}
                        disabled={updatingId === (customer._id || customer.id)}
                        onChange={e => handleRoleChange(customer, e.target.value)}
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td><span className="cm-date">{formatDate(customer.createdAt)}</span></td>
                    <td>
                      <span className={`cm-status ${customer.isActive ? 'status-active' : 'status-inactive'}`}>
                        {customer.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="cm-actions">
                        <button
                          className="cm-view-btn"
                          onClick={() => handleSelectCustomer(customer._id || customer.id)}
                        >
                          View Details
                        </button>
                        <button
                          className={`cm-toggle-btn ${customer.isActive ? 'deactivate' : 'activate'}`}
                          onClick={() => handleToggleActive(customer)}
                          disabled={updatingId === (customer._id || customer.id)}
                        >
                          {customer.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="cm-pagination">
              <button
                className="cm-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                ← Prev
              </button>
              <span className="cm-page-info">Page {currentPage} of {totalPages}</span>
              <button
                className="cm-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Customer Detail Modal */}
      {(selectedCustomer || loadingDetail) && (
        <div className="cm-modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="cm-modal cm-modal-large" onClick={e => e.stopPropagation()}>
            {loadingDetail ? (
              <div className="cm-loading" style={{ minHeight: '250px' }}>
                <div className="cm-spinner"></div>
                <p>Loading customer profile & orders...</p>
              </div>
            ) : (
              <>
                <div className="cm-modal-header">
                  <div className="cm-modal-avatar" style={{ background: getAvatarColor(selectedCustomer.name) }}>
                    {getInitials(selectedCustomer.name)}
                  </div>
                  <div>
                    <h2>{selectedCustomer.name}</h2>
                    <p>{selectedCustomer.email}</p>
                  </div>
                  <button className="cm-modal-close" onClick={() => setSelectedCustomer(null)}>✕</button>
                </div>

                <div className="cm-modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  {/* Account Metadata */}
                  <div className="cm-detail-grid">
                    <div className="cm-detail-item">
                      <label>Role</label>
                      <span className={`cm-role-pill ${selectedCustomer.role === 'ADMIN' ? 'role-admin' : 'role-user'}`}>
                        {selectedCustomer.role}
                      </span>
                    </div>
                    <div className="cm-detail-item">
                      <label>Status</label>
                      <span className={`cm-status ${selectedCustomer.isActive ? 'status-active' : 'status-inactive'}`}>
                        {selectedCustomer.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                    <div className="cm-detail-item">
                      <label>Customer ID</label>
                      <span className="cm-id">{selectedCustomer._id || selectedCustomer.id}</span>
                    </div>
                    <div className="cm-detail-item">
                      <label>Registration Date</label>
                      <span>{formatDate(selectedCustomer.createdAt)}</span>
                    </div>
                  </div>

                  {/* Order Statistics */}
                  {selectedCustomer.stats && (
                    <div className="cm-modal-section">
                      <h4 className="cm-section-title">📊 Order Statistics</h4>
                      <div className="cm-stats-grid">
                        <div className="cm-mini-stat">
                          <span className="val">{selectedCustomer.stats.totalOrders}</span>
                          <span className="lbl">Total Orders</span>
                        </div>
                        <div className="cm-mini-stat">
                          <span className="val">{selectedCustomer.stats.completedOrders}</span>
                          <span className="lbl">Delivered</span>
                        </div>
                        <div className="cm-mini-stat">
                          <span className="val">{selectedCustomer.stats.cancelledOrders}</span>
                          <span className="lbl">Cancelled</span>
                        </div>
                        <div className="cm-mini-stat">
                          <span className="val">{formatCurrency(selectedCustomer.stats.totalOrderValue)}</span>
                          <span className="lbl">Total Spend</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Saved Addresses */}
                  <div className="cm-modal-section">
                    <h4 className="cm-section-title">📍 Saved Addresses ({selectedCustomer.addresses?.length || 0})</h4>
                    {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                      <div className="cm-addresses-list">
                        {selectedCustomer.addresses.map(addr => (
                          <div key={addr._id} className="cm-address-card">
                            <div className="cm-address-top">
                              <strong>{addr.fullName}</strong>
                              <span className="cm-address-badge">{addr.type}</span>
                              {addr.isDefault && <span className="cm-default-badge">DEFAULT</span>}
                            </div>
                            <p>{addr.addressLine1} {addr.addressLine2 && `, ${addr.addressLine2}`}</p>
                            <p>{addr.city}, {addr.state} - {addr.postalCode}, {addr.country}</p>
                            <p className="cm-phone">📞 {addr.phone}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="cm-empty-text">No saved addresses for this customer.</p>
                    )}
                  </div>

                  {/* Order History */}
                  <div className="cm-modal-section">
                    <h4 className="cm-section-title">📦 Order History ({selectedCustomer.orders?.length || 0})</h4>
                    {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                      <div className="cm-orders-table-wrap">
                        <table className="cm-orders-table">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Status</th>
                              <th>Tracking</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCustomer.orders.map(order => (
                              <tr key={order._id}>
                                <td><span className="cm-id">#{order._id.slice(-8).toUpperCase()}</span></td>
                                <td>{formatDate(order.createdAt)}</td>
                                <td>{formatCurrency(order.total || (order.subtotal - order.discount + order.shipping))}</td>
                                <td><span className={`cm-status-tag status-${order.status}`}>{order.status}</span></td>
                                <td>{order.trackingNumber || order.carrier ? `${order.carrier}: ${order.trackingNumber}` : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="cm-empty-text">No order history found for this customer.</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="cm-modal-actions" style={{ marginTop: '1.5rem' }}>
                    <button
                      className={`cm-toggle-btn-lg ${selectedCustomer.isActive ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleActive(selectedCustomer)}
                      disabled={updatingId === (selectedCustomer._id || selectedCustomer.id)}
                    >
                      {selectedCustomer.isActive ? '🚫 Deactivate Account' : '✅ Activate Account'}
                    </button>
                    <div className="cm-role-change">
                      <label>Change Role:</label>
                      <select
                        value={selectedCustomer.role}
                        onChange={e => handleRoleChange(selectedCustomer, e.target.value)}
                        disabled={updatingId === (selectedCustomer._id || selectedCustomer.id)}
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersManager;

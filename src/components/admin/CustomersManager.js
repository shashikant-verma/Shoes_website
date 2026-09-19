import React, { useState, useEffect } from 'react';
import './CustomersManager.css';
import api from '../../services/api';

function CustomersManager() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [toast, setToast] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const LIMIT = 10;

  useEffect(() => {
    loadCustomers();
  }, [currentPage, roleFilter]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit: LIMIT });
      if (roleFilter) params.append('role', roleFilter);
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
  };

  const handleToggleActive = async (customer) => {
    setUpdatingId(customer._id);
    try {
      await api.put(`/users/${customer._id}`, { isActive: !customer.isActive });
      setCustomers(prev => prev.map(c => c._id === customer._id ? { ...c, isActive: !c.isActive } : c));
      if (selectedCustomer?._id === customer._id) {
        setSelectedCustomer(prev => ({ ...prev, isActive: !prev.isActive }));
      }
      showToast(`Customer ${!customer.isActive ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch {
      showToast('Failed to update customer', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (customer, newRole) => {
    setUpdatingId(customer._id);
    try {
      await api.put(`/users/${customer._id}`, { role: newRole });
      setCustomers(prev => prev.map(c => c._id === customer._id ? { ...c, role: newRole } : c));
      if (selectedCustomer?._id === customer._id) {
        setSelectedCustomer(prev => ({ ...prev, role: newRole }));
      }
      showToast('Role updated successfully', 'success');
    } catch {
      showToast('Failed to update role', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

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
          <h1 className="cm-title">Customers</h1>
          <p className="cm-subtitle">{totalCustomers} registered customer{totalCustomers !== 1 ? 's' : ''}</p>
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
          <div className="cm-stat-label">Active</div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-value">{customers.filter(c => c.role === 'ADMIN').length}</div>
          <div className="cm-stat-label">Admins</div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-value">{customers.filter(c => !c.isActive).length}</div>
          <div className="cm-stat-label">Inactive</div>
        </div>
      </div>

      {/* Filters */}
      <div className="cm-toolbar">
        <div className="cm-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="cm-search-input"
          />
          {searchQuery && <button className="cm-clear-search" onClick={() => setSearchQuery('')}>✕</button>}
        </div>
        <select
          className="cm-role-select"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="USER">Users</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="cm-loading"><div className="cm-spinner"></div><p>Loading customers...</p></div>
      ) : error ? (
        <div className="cm-error"><span>⚠️</span><h3>{error}</h3><button onClick={loadCustomers}>Try Again</button></div>
      ) : filteredCustomers.length === 0 ? (
        <div className="cm-empty">
          <div className="cm-empty-icon">👥</div>
          <h3>No customers found</h3>
          <p>{searchQuery ? 'Try a different search term.' : 'No customers have registered yet.'}</p>
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
                {filteredCustomers.map(customer => (
                  <tr key={customer._id} className="cm-row" onClick={() => setSelectedCustomer(customer)}>
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
                        disabled={updatingId === customer._id}
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
                          onClick={() => setSelectedCustomer(customer)}
                        >View</button>
                        <button
                          className={`cm-toggle-btn ${customer.isActive ? 'deactivate' : 'activate'}`}
                          onClick={() => handleToggleActive(customer)}
                          disabled={updatingId === customer._id}
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
              <button className="cm-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>← Prev</button>
              <span className="cm-page-info">Page {currentPage} of {totalPages}</span>
              <button className="cm-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="cm-modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="cm-modal" onClick={e => e.stopPropagation()}>
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
            <div className="cm-modal-body">
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
                  <span className="cm-id">{selectedCustomer._id}</span>
                </div>
                <div className="cm-detail-item">
                  <label>Joined</label>
                  <span>{formatDate(selectedCustomer.createdAt)}</span>
                </div>
              </div>

              <div className="cm-modal-actions">
                <button
                  className={`cm-toggle-btn-lg ${selectedCustomer.isActive ? 'deactivate' : 'activate'}`}
                  onClick={() => handleToggleActive(selectedCustomer)}
                  disabled={updatingId === selectedCustomer._id}
                >
                  {selectedCustomer.isActive ? '🚫 Deactivate Account' : '✅ Activate Account'}
                </button>
                <div className="cm-role-change">
                  <label>Change Role:</label>
                  <select
                    value={selectedCustomer.role}
                    onChange={e => handleRoleChange(selectedCustomer, e.target.value)}
                    disabled={updatingId === selectedCustomer._id}
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersManager;

import React, { useState, useEffect, useCallback } from 'react';
import couponService from '../../services/couponService';
import './CouponsManager.css';

function CouponsManager() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [maxDiscount, setMaxDiscount] = useState('');
  const [minimumOrderValue, setMinimumOrderValue] = useState(0);
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const res = await couponService.getAllCouponsAdmin();
    if (res.success) {
      setCoupons(res.data || []);
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to load coupons' });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const resetForm = () => {
    setCode('');
    setDescription('');
    setDiscountType('PERCENTAGE');
    setDiscountValue(10);
    setMaxDiscount('');
    setMinimumOrderValue(0);
    setExpiryDate('');
    setUsageLimit('');
    setPerUserLimit(1);
    setIsActive(true);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (coupon) => {
    setEditingId(coupon._id);
    setIsEditing(true);
    setCode(coupon.code);
    setDescription(coupon.description || '');
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setMaxDiscount(coupon.maxDiscount !== undefined ? coupon.maxDiscount : '');
    setMinimumOrderValue(coupon.minimumOrderValue || 0);
    setExpiryDate(coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '');
    setUsageLimit(coupon.usageLimit !== undefined ? coupon.usageLimit : '');
    setPerUserLimit(coupon.perUserLimit || 1);
    setIsActive(coupon.isActive);
    setShowModal(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Coupon code is required' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const payload = {
      code: code.trim().toUpperCase(),
      description,
      discountType,
      discountValue: Number(discountValue),
      maxDiscount: maxDiscount !== '' ? Number(maxDiscount) : undefined,
      minimumOrderValue: Number(minimumOrderValue) || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      usageLimit: usageLimit !== '' ? Number(usageLimit) : undefined,
      perUserLimit: Number(perUserLimit) || 1,
      isActive
    };

    let res;
    if (isEditing) {
      res = await couponService.updateCouponAdmin(editingId, payload);
    } else {
      res = await couponService.createCouponAdmin(payload);
    }

    setSubmitting(false);

    if (res.success) {
      setMessage({ type: 'success', text: res.message || 'Coupon saved successfully' });
      setShowModal(false);
      resetForm();
      fetchCoupons();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to save coupon' });
    }
  };

  const handleToggleActive = async (coupon) => {
    const res = await couponService.updateCouponAdmin(coupon._id, {
      isActive: !coupon.isActive
    });
    if (res.success) {
      fetchCoupons();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to update coupon status' });
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      const res = await couponService.deleteCouponAdmin(id);
      if (res.success) {
        setMessage({ type: 'success', text: 'Coupon deleted successfully' });
        fetchCoupons();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to delete coupon' });
      }
    }
  };

  const getCouponStatus = (coupon) => {
    if (!coupon.isActive) return { text: 'INACTIVE', class: 'status-inactive' };
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return { text: 'EXPIRED', class: 'status-expired' };
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { text: 'EXHAUSTED', class: 'status-exhausted' };
    }
    return { text: 'ACTIVE', class: 'status-active' };
  };

  return (
    <div className="coupons-manager-container">
      <div className="coupons-manager-header">
        <div>
          <h2>Coupons & Discount Management</h2>
          <p>Create and manage discount codes, usage limits, and minimum order rules</p>
        </div>
        <button className="btn-create-coupon" onClick={handleOpenCreateModal}>
          ➕ Create New Coupon
        </button>
      </div>

      {message.text && (
        <div className={`manager-alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Coupons Table */}
      <div className="coupons-table-wrapper">
        {loading ? (
          <div className="loading-spinner-box">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="empty-coupons-box">No coupons found. Create your first coupon code!</div>
        ) : (
          <table className="coupons-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type & Discount</th>
                <th>Min. Order</th>
                <th>Usage / Limit</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <tr key={coupon._id}>
                    <td className="col-code">
                      <strong className="code-badge">{coupon.code}</strong>
                      {coupon.description && <p className="code-desc">{coupon.description}</p>}
                    </td>
                    <td className="col-discount">
                      <span className="discount-type-tag">
                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                      </span>
                      {coupon.maxDiscount > 0 && (
                        <span className="max-cap-info"> (Max: ₹{coupon.maxDiscount})</span>
                      )}
                    </td>
                    <td className="col-min-order">
                      {coupon.minimumOrderValue > 0 ? `₹${coupon.minimumOrderValue.toLocaleString()}` : 'None'}
                    </td>
                    <td className="col-usage">
                      {coupon.usageCount} / {coupon.usageLimit ? coupon.usageLimit : '∞'}
                    </td>
                    <td className="col-expiry">
                      {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="col-status">
                      <span className={`coupon-status-pill ${status.class}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="col-actions">
                      <div className="action-buttons-group">
                        <button
                          className="btn-action edit"
                          onClick={() => handleOpenEditModal(coupon)}
                        >
                          Edit
                        </button>
                        <button
                          className={`btn-action toggle ${coupon.isActive ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleActive(coupon)}
                        >
                          {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn-action delete"
                          onClick={() => handleDeleteCoupon(coupon._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Coupon Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="coupon-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Coupon' : 'Create New Coupon'}</h3>
              <button className="btn-close-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveCoupon} className="coupon-form">
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Coupon Code *</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="e.g. SUMMER20"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Discount Type *</label>
                  <select
                    className="modal-select"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. 20% off summer collection"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Discount Value * ({discountType === 'PERCENTAGE' ? '%' : '₹'})</label>
                  <input
                    type="number"
                    className="modal-input"
                    placeholder="e.g. 20"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    min="0.01"
                    max={discountType === 'PERCENTAGE' ? 100 : undefined}
                    required
                  />
                </div>

                {discountType === 'PERCENTAGE' && (
                  <div className="form-group flex-1">
                    <label>Max Discount Cap (₹ Optional)</label>
                    <input
                      type="number"
                      className="modal-input"
                      placeholder="e.g. 500"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group flex-1">
                  <label>Minimum Order Value (₹)</label>
                  <input
                    type="number"
                    className="modal-input"
                    placeholder="e.g. 1000"
                    value={minimumOrderValue}
                    onChange={(e) => setMinimumOrderValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Expiry Date (Optional)</label>
                  <input
                    type="date"
                    className="modal-input"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Global Usage Limit (Optional)</label>
                  <input
                    type="number"
                    className="modal-input"
                    placeholder="e.g. 100"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Per User Limit</label>
                  <input
                    type="number"
                    className="modal-input"
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(e.target.value)}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span>Is Active</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : isEditing ? 'Update Coupon' : 'Create Coupon'}
                </button>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CouponsManager;

import React, { useState, useEffect, useCallback } from 'react';
import './AdminSettings.css';
import settingsService from '../../services/settingsService';

function AdminSettings({ showToast }) {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Store Configuration State (Backed by MongoDB)
  const [storeInfo, setStoreInfo] = useState({
    storeName: 'SoleVibe Footwear',
    tagline: 'Engineered For Peak Biomechanical Motion',
    supportEmail: 'support@solevibe.com',
    contactPhone: '+91 1800-765-3842',
    currencySymbol: '₹',
    currencyCode: 'INR',
    freeShippingThreshold: 15000,
    standardShippingFee: 150,
    estimatedDeliveryDays: '3-5 business days',
    returnWindowDays: 7,
    taxPercentage: 18,
    isTaxInclusive: true,
    gstNumber: '27AABCU9603R1ZM',
    enableGst: true,
    enableCod: true,
    maintenanceMode: false,
    maintenanceMessage: 'SoleVibe is undergoing scheduled performance upgrades. We will be back shortly.',
    storeAddress: {
      street: 'SoleVibe Footwear Tower, Bandra Kurla Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400051',
      country: 'India'
    }
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const res = await settingsService.getSettings();
    if (res.success && res.data) {
      setStoreInfo(prev => ({
        ...prev,
        ...res.data,
        storeAddress: {
          ...prev.storeAddress,
          ...(res.data.storeAddress || {})
        }
      }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (field, value) => {
    setStoreInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setStoreInfo(prev => ({
      ...prev,
      storeAddress: {
        ...prev.storeAddress,
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const res = await settingsService.updateSettings(storeInfo);
    setIsSaving(false);

    if (res.success) {
      if (showToast) showToast('Store settings saved to MongoDB successfully!', 'success');
    } else {
      if (showToast) showToast(res.message || 'Failed to save store settings', 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Loading store configuration...</div>;
  }

  return (
    <div className="admin-settings-container page-container fade-in">
      <div className="settings-header">
        <h1 className="headline-lg">STORE CONFIGURATION & SETTINGS</h1>
        <p className="settings-subtitle">Manage store information, currency, shipping rules, tax settings, and policies</p>
      </div>

      <div className="settings-tabs-row">
        <button
          className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          ⚙️ General Info
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shipping')}
        >
          🚚 Shipping & Delivery
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
          onClick={() => setActiveTab('finance')}
        >
          💳 Taxes & Currency
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          📜 Policies & Maintenance
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="settings-form glass-panel">
        {activeTab === 'general' && (
          <div className="settings-group fade-in">
            <h3 className="group-title headline-md">Store Identity & Contact</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Store Brand Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeInfo.storeName || ''}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Brand Tagline</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeInfo.tagline || ''}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Customer Support Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={storeInfo.supportEmail || ''}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Support Phone Hotline</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeInfo.contactPhone || ''}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  required
                />
              </div>
            </div>

            <h3 className="group-title headline-md" style={{ marginTop: '1.5rem' }}>Store Physical Address</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeInfo.storeAddress?.street || ''}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeInfo.storeAddress?.city || ''}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeInfo.storeAddress?.state || ''}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Postal Code / PIN Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeInfo.storeAddress?.postalCode || ''}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="settings-group fade-in">
            <h3 className="group-title headline-md">Shipping Thresholds & Delivery SLA</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Free Shipping Minimum Threshold (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={storeInfo.freeShippingThreshold || 0}
                  onChange={(e) => handleChange('freeShippingThreshold', Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Flat Standard Shipping Fee (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={storeInfo.standardShippingFee || 0}
                  onChange={(e) => handleChange('standardShippingFee', Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Standard Delivery SLA Label</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeInfo.estimatedDeliveryDays || ''}
                  onChange={(e) => handleChange('estimatedDeliveryDays', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Allowed Return Window (Days)</label>
                <input
                  type="number"
                  className="form-input"
                  value={storeInfo.returnWindowDays || 14}
                  onChange={(e) => handleChange('returnWindowDays', Number(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="settings-group fade-in">
            <h3 className="group-title headline-md">Currency & Tax Configuration</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeInfo.currencySymbol || '₹'}
                  onChange={(e) => handleChange('currencySymbol', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Currency Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeInfo.currencyCode || 'INR'}
                  onChange={(e) => handleChange('currencyCode', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">GST / Tax Percentage (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={storeInfo.taxPercentage || 18}
                  onChange={(e) => handleChange('taxPercentage', Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Registered GSTIN Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeInfo.gstNumber || ''}
                  onChange={(e) => handleChange('gstNumber', e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group checkbox-group">
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={storeInfo.enableCod}
                    onChange={(e) => handleChange('enableCod', e.target.checked)}
                  />
                  Enable Cash on Delivery (COD) Option
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={storeInfo.isTaxInclusive}
                    onChange={(e) => handleChange('isTaxInclusive', e.target.checked)}
                  />
                  Display Prices Inclusive of Taxes
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="settings-group fade-in">
            <h3 className="group-title headline-md">Store Policies & Maintenance Mode</h3>
            <div className="form-group">
              <label className="form-label">Return Policy Statement</label>
              <textarea
                rows="3"
                className="form-input"
                value={storeInfo.returnPolicy || ''}
                onChange={(e) => handleChange('returnPolicy', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Refund Policy Statement</label>
              <textarea
                rows="3"
                className="form-input"
                value={storeInfo.refundPolicy || ''}
                onChange={(e) => handleChange('refundPolicy', e.target.value)}
              />
            </div>

            <div className="form-group checkbox-group" style={{ marginTop: '1.5rem', background: 'rgba(255, 77, 46, 0.08)', padding: '16px', borderRadius: '8px' }}>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4d2e', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={storeInfo.maintenanceMode}
                  onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                />
                ⚠️ Enable Storefront Maintenance Mode
              </label>
              {storeInfo.maintenanceMode && (
                <div style={{ marginTop: '10px' }}>
                  <label className="form-label">Maintenance Banner Message</label>
                  <input
                    type="text"
                    className="form-input"
                    value={storeInfo.maintenanceMessage || ''}
                    onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="settings-form-actions">
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving to Database...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminSettings;

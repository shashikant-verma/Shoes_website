import React, { useState } from 'react';
import './AdminSettings.css';

function AdminSettings({ showToast }) {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // Store Configuration State (Stored in localStorage / initialized with defaults)
  const [storeInfo, setStoreInfo] = useState(() => {
    const saved = localStorage.getItem('solevibe_admin_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      storeName: 'SoleVibe Footwear',
      supportEmail: 'support@solevibe.com',
      contactPhone: '+91 1800-765-3842',
      currencySymbol: '₹',
      currencyCode: 'INR',
      freeShippingThreshold: 2000,
      standardShippingFee: 150,
      estimatedDeliveryDays: '3-5 business days',
      returnWindowDays: 14,
      taxPercentage: 18,
      enableCod: true
    };
  });

  const handleChange = (field, value) => {
    setStoreInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      localStorage.setItem('solevibe_admin_settings', JSON.stringify(storeInfo));
      setIsSaving(false);
      if (showToast) showToast('Store settings saved successfully!', 'success');
    }, 400);
  };

  return (
    <div className="admin-settings-container page-container fade-in">
      <div className="settings-header">
        <h1 className="headline-lg">STORE CONFIGURATION & SETTINGS</h1>
        <p className="settings-subtitle">Manage store information, currency, shipping rules, and policies</p>
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
                  value={storeInfo.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Support Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={storeInfo.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Customer Support Phone Hotline</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeInfo.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Allowed Return Window (Days)</label>
                <input
                  type="number"
                  className="form-input"
                  value={storeInfo.returnWindowDays}
                  onChange={(e) => handleChange('returnWindowDays', Number(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="settings-group fade-in">
            <h3 className="group-title headline-md">Shipping Thresholds & SLA</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Free Shipping Minimum Threshold (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={storeInfo.freeShippingThreshold}
                  onChange={(e) => handleChange('freeShippingThreshold', Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Flat Standard Shipping Fee (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={storeInfo.standardShippingFee}
                  onChange={(e) => handleChange('standardShippingFee', Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Standard Delivery SLA Label</label>
              <input
                type="text"
                className="form-input"
                value={storeInfo.estimatedDeliveryDays}
                onChange={(e) => handleChange('estimatedDeliveryDays', e.target.value)}
                required
              />
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
                  value={storeInfo.currencySymbol}
                  onChange={(e) => handleChange('currencySymbol', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Currency Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeInfo.currencyCode}
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
                  value={storeInfo.taxPercentage}
                  onChange={(e) => handleChange('taxPercentage', Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={storeInfo.enableCod}
                    onChange={(e) => handleChange('enableCod', e.target.checked)}
                  />
                  Enable Cash on Delivery (COD) Option
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="settings-form-actions">
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminSettings;

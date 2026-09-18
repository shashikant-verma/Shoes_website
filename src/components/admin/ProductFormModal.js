import React, { useState, useEffect } from 'react';
import './ProductFormModal.css';
import productService from '../../services/productService';

const FormIcons = {
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  ),
  Add: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  ),
  Remove: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  )
};

function ProductFormModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    brand: 'SoleVibe',
    sku: '',
    category: 'men',
    gender: 'men',
    productType: '',
    collectionName: '',
    price: '',
    originalPrice: '',
    discount: 0,
    description: '',
    image: '',
    images: [''],
    sizes: [''],
    colors: [''],
    specifications: {
      weight: '',
      drop: '',
      energy: '',
      material: '',
      sole: '',
      closure: '',
      type: '',
      use: ''
    },
    features: [''],
    badge: '',
    badgeColor: 'primary',
    stock: 10,
    featured: false,
    isNew: false,
    onSale: false,
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        specifications: product.specifications || {
          weight: '',
          drop: '',
          energy: '',
          material: '',
          sole: '',
          closure: '',
          type: '',
          use: ''
        },
        features: product.features?.length ? product.features : [''],
        images: product.images?.length ? product.images : [''],
        sizes: product.sizes?.length ? product.sizes : [''],
        colors: product.colors?.length ? product.colors : [''],
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        discount: product.discount || 0,
        stock: product.stock || 10
      });
    }
  }, [product]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('spec_')) {
      const specKey = name.replace('spec_', '');
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayChange = (arrayName, index, value) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (arrayName) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], '']
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    if (formData[arrayName].length > 1) {
      setFormData(prev => ({
        ...prev,
        [arrayName]: prev[arrayName].filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.image.trim()) {
      newErrors.image = 'Product image is required';
    } else if (!isValidUrl(formData.image)) {
      newErrors.image = 'Please enter a valid image URL';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Clean up the data
      const cleanedData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        discount: parseFloat(formData.discount) || 0,
        stock: parseInt(formData.stock) || 0,
        features: formData.features.filter(f => f.trim() !== ''),
        images: formData.images.filter(img => img.trim() !== ''),
        sizes: formData.sizes.filter(size => size.trim() !== ''),
        colors: formData.colors.filter(color => color.trim() !== '')
      };

      let result;
      if (product) {
        result = await productService.updateProduct(product._id, cleanedData);
      } else {
        result = await productService.createProduct(cleanedData);
      }

      if (result.success) {
        onSave();
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors({ submit: 'Failed to save product. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'media', label: 'Media' },
    { id: 'details', label: 'Details' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="product-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FormIcons.Close />
          </button>
        </div>

        <div className="modal-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="modal-content">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="form-section">
                <h3 className="section-title">Product Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Product Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      placeholder="e.g., Nike Air Max 270"
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Brand name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Product SKU"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Category <span className="required">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Product Type</label>
                    <input
                      type="text"
                      name="productType"
                      value={formData.productType}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Running Shoes"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Collection</label>
                    <input
                      type="text"
                      name="collectionName"
                      value={formData.collectionName}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Collection name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Description <span className="required">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`form-textarea ${errors.description ? 'error' : ''}`}
                    rows="4"
                    placeholder="Describe the product features, benefits, and details..."
                  />
                  {errors.description && <span className="error-message">{errors.description}</span>}
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="form-section">
                <h3 className="section-title">Pricing Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Price (₹) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className={`form-input ${errors.price ? 'error' : ''}`}
                      placeholder="2499"
                      step="0.01"
                      min="0"
                    />
                    {errors.price && <span className="error-message">{errors.price}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Original Price (₹)</label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="3499"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Discount (%)</label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Badge</label>
                    <input
                      type="text"
                      name="badge"
                      value={formData.badge}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., SALE, NEW"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Badge Color</label>
                  <select
                    name="badgeColor"
                    value={formData.badgeColor}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="primary">Primary (Orange)</option>
                    <option value="secondary">Secondary (Purple)</option>
                    <option value="tertiary">Tertiary (Cyan)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="form-section">
                <h3 className="section-title">Inventory & Variants</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Stock Quantity <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className={`form-input ${errors.stock ? 'error' : ''}`}
                      min="0"
                    />
                    {errors.stock && <span className="error-message">{errors.stock}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>
                </div>

                {/* Sizes */}
                <div className="form-group">
                  <label className="form-label">Available Sizes</label>
                  <div className="array-inputs">
                    {formData.sizes.map((size, index) => (
                      <div key={index} className="array-input-row">
                        <input
                          type="text"
                          value={size}
                          onChange={(e) => handleArrayChange('sizes', index, e.target.value)}
                          className="form-input"
                          placeholder="Size (e.g., 42, M, L)"
                        />
                        {formData.sizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('sizes', index)}
                            className="remove-btn"
                          >
                            <FormIcons.Remove />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('sizes')}
                      className="add-btn"
                    >
                      <FormIcons.Add />
                      Add Size
                    </button>
                  </div>
                </div>

                {/* Colors */}
                <div className="form-group">
                  <label className="form-label">Available Colors</label>
                  <div className="array-inputs">
                    {formData.colors.map((color, index) => (
                      <div key={index} className="array-input-row">
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => handleArrayChange('colors', index, e.target.value)}
                          className="form-input"
                          placeholder="Color name"
                        />
                        {formData.colors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('colors', index)}
                            className="remove-btn"
                          >
                            <FormIcons.Remove />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('colors')}
                      className="add-btn"
                    >
                      <FormIcons.Add />
                      Add Color
                    </button>
                  </div>
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                    />
                    Featured Product
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isNew"
                      checked={formData.isNew}
                      onChange={handleInputChange}
                    />
                    New Product
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="onSale"
                      checked={formData.onSale}
                      onChange={handleInputChange}
                    />
                    On Sale
                  </label>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="form-section">
                <h3 className="section-title">Product Images</h3>
                
                <div className="form-group">
                  <label className="form-label">
                    Main Image URL <span className="required">*</span>
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className={`form-input ${errors.image ? 'error' : ''}`}
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                  {errors.image && <span className="error-message">{errors.image}</span>}
                  <small className="form-hint">Use a high-quality image URL</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Images</label>
                  <div className="array-inputs">
                    {formData.images.map((image, index) => (
                      <div key={index} className="array-input-row">
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => handleArrayChange('images', index, e.target.value)}
                          className="form-input"
                          placeholder="https://images.unsplash.com/photo-..."
                        />
                        {formData.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('images', index)}
                            className="remove-btn"
                          >
                            <FormIcons.Remove />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('images')}
                      className="add-btn"
                    >
                      <FormIcons.Add />
                      Add Image
                    </button>
                  </div>
                </div>

                {formData.image && (
                  <div className="image-preview">
                    <label className="form-label">Preview</label>
                    <img src={formData.image} alt="Preview" className="preview-image" />
                  </div>
                )}
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="form-section">
                <h3 className="section-title">Technical Specifications</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Weight</label>
                    <input
                      type="text"
                      name="spec_weight"
                      value={formData.specifications.weight}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., 270g"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Drop</label>
                    <input
                      type="text"
                      name="spec_drop"
                      value={formData.specifications.drop}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., 10mm"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Energy Return</label>
                    <input
                      type="text"
                      name="spec_energy"
                      value={formData.specifications.energy}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., 85%"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Material</label>
                    <input
                      type="text"
                      name="spec_material"
                      value={formData.specifications.material}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Flyknit"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Sole</label>
                    <input
                      type="text"
                      name="spec_sole"
                      value={formData.specifications.sole}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Air Max"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Closure</label>
                    <input
                      type="text"
                      name="spec_closure"
                      value={formData.specifications.closure}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Lace-up"
                    />
                  </div>
                </div>

                <h3 className="section-title">Features</h3>
                
                <div className="form-group">
                  <div className="array-inputs">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="array-input-row">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleArrayChange('features', index, e.target.value)}
                          className="form-input"
                          placeholder="Product feature"
                        />
                        {formData.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('features', index)}
                            className="remove-btn"
                          >
                            <FormIcons.Remove />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('features')}
                      className="add-btn"
                    >
                      <FormIcons.Add />
                      Add Feature
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="form-error">
              {errors.submit}
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  {product ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                product ? 'Update Product' : 'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductFormModal;
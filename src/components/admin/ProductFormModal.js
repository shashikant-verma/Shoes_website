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
    sizes: ['7', '8', '9', '10', '11'], // Sensible shoe defaults
    colors: ['Black', 'White'], // Sensible color defaults
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
  const [tabErrors, setTabErrors] = useState({});  // Track errors per tab

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
    const newTabErrors = { basic: false, pricing: false, inventory: false, media: false, details: false };

    // Basic Info tab validation
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
      newTabErrors.basic = true;
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      newTabErrors.basic = true;
    }

    // Pricing tab validation
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Valid price is required';
      newTabErrors.pricing = true;
    }

    // Inventory tab validation
    if (formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
      newTabErrors.inventory = true;
    }

    // Validate that at least one size is provided
    const validSizes = formData.sizes.filter(size => size.trim());
    if (validSizes.length === 0) {
      newErrors.sizes = 'At least one size is required';
      newTabErrors.inventory = true;
    }

    // Validate that at least one color is provided
    const validColors = formData.colors.filter(color => color.trim());
    if (validColors.length === 0) {
      newErrors.colors = 'At least one color is required';
      newTabErrors.inventory = true;
    }

    // Media tab validation
    if (!formData.image.trim()) {
      newErrors.image = 'Product image is required';
      newTabErrors.media = true;
    } else if (!isValidUrl(formData.image)) {
      newErrors.image = 'Please enter a valid image URL';
      newTabErrors.media = true;
    }

    // Validate additional images
    formData.images.forEach((img, index) => {
      if (img.trim() && !isValidUrl(img)) {
        newErrors[`image_${index}`] = `Image ${index + 1} URL is invalid`;
        newTabErrors.media = true;
      }
    });

    console.log('Form validation errors:', newErrors); // Debug log
    console.log('Tab errors:', newTabErrors); // Debug log
    
    setErrors(newErrors);
    setTabErrors(newTabErrors);

    const tabOrder = ['basic', 'pricing', 'inventory', 'media', 'details'];
    const firstErrorTab = tabOrder.find(tab => newTabErrors[tab]);

    return {
      isValid: Object.keys(newErrors).length === 0,
      firstErrorTab
    };
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
    
    console.log('Form submission started'); // Debug log
    console.log('Form data:', formData); // Debug log
    
    const { isValid, firstErrorTab } = validateForm();
    if (!isValid) {
      console.log('Form validation failed'); // Debug log
      if (firstErrorTab) {
        setActiveTab(firstErrorTab);
        console.log('Switched to tab with errors:', firstErrorTab); // Debug log
      }
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

      // Remove empty values
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '' || cleanedData[key] === null) {
          delete cleanedData[key];
        }
      });

      console.log('Cleaned data for API:', cleanedData); // Debug log

      let result;
      if (product) {
        console.log('Updating product:', product._id); // Debug log
        result = await productService.updateProduct(product._id, cleanedData);
      } else {
        console.log('Creating new product'); // Debug log
        result = await productService.createProduct(cleanedData);
      }

      console.log('API result:', result); // Debug log

      if (result.success) {
        console.log('Product saved successfully'); // Debug log
        onSave(!!product, formData.name); // Pass isEdit flag and product name
      } else {
        console.log('API returned error:', result); // Debug log
        // Handle specific error cases
        if (result.message.includes('already exists')) {
          if (result.message.includes('sku')) {
            setErrors({ sku: 'This SKU already exists' });
          } else if (result.message.includes('name')) {
            setErrors({ name: 'A product with this name already exists' });
          } else {
            setErrors({ submit: result.message });
          }
        } else if (result.errors) {
          // Handle validation errors
          const errorObj = {};
          result.errors.forEach(error => {
            if (error.includes('name')) errorObj.name = error;
            else if (error.includes('price')) errorObj.price = error;
            else if (error.includes('description')) errorObj.description = error;
            else if (error.includes('image')) errorObj.image = error;
            else if (error.includes('stock')) errorObj.stock = error;
            else errorObj.submit = error;
          });
          setErrors(errorObj);
        } else {
          setErrors({ submit: result.message });
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors({ submit: 'Failed to save product. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const fillSampleProduct = () => {
    setFormData({
      name: 'Nike Air Max 270',
      brand: 'Nike',
      sku: '',
      category: 'men',
      gender: 'men',
      productType: 'Running Shoes',
      collectionName: 'Air Max',
      price: '12999',
      originalPrice: '15999',
      discount: 20,
      description: 'Experience ultimate comfort with the Nike Air Max 270. Featuring Nike\'s largest heel Air unit yet and a sleek design perfect for everyday wear and athletic performance.',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=600&fit=crop&crop=center'
      ],
      sizes: ['7', '8', '9', '10', '11', '12'],
      colors: ['Black', 'White', 'Blue', 'Red'],
      specifications: {
        weight: '270g',
        drop: '10mm',
        energy: '85%',
        material: 'Mesh Upper',
        sole: 'Air Max',
        closure: 'Lace-up',
        type: 'Running',
        use: 'Everyday, Training'
      },
      features: [
        'Air Max cushioning technology',
        'Breathable mesh upper',
        'Lightweight construction',
        'Durable rubber outsole'
      ],
      badge: 'POPULAR',
      badgeColor: 'primary',
      stock: 50,
      featured: true,
      isNew: true,
      onSale: true,
      status: 'active'
    });
    
    // Switch to basic tab to show filled data
    setActiveTab('basic');
    
    // Clear any existing errors
    setErrors({});
    setTabErrors({});
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
              className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${tabErrors[tab.id] ? 'has-error' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tabErrors[tab.id] && <span className="error-indicator">●</span>}
            </button>
          ))}
          
          {/* Fill Sample Button */}
          {!product && (
            <button
              type="button"
              onClick={fillSampleProduct}
              className="btn-fill-sample"
              title="Fill form with sample product data"
            >
              <FormIcons.Add />
              Fill Sample
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          {/* Validation Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="validation-error-banner">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <strong>Please fix the following issues:</strong>
                <ul className="error-list">
                  {Object.entries(errors).map(([field, message]) => (
                    field !== 'submit' && (
                      <li key={field}>{message}</li>
                    )
                  ))}
                </ul>
                <small>Click the tabs with red dots (●) to fix required fields.</small>
              </div>
            </div>
          )}

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
                  <label className="form-label">
                    Available Sizes <span className="required">*</span>
                  </label>
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
                  {errors.sizes && <span className="error-message">{errors.sizes}</span>}
                </div>

                {/* Colors */}
                <div className="form-group">
                  <label className="form-label">
                    Available Colors <span className="required">*</span>
                  </label>
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
                  {errors.colors && <span className="error-message">{errors.colors}</span>}
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
                <div className="error-icon">⚠️</div>
                <div className="error-content">
                  <strong>Error:</strong> {errors.submit}
                  <br />
                  <small>Please check your input and try again. If the problem persists, contact support.</small>
                </div>
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
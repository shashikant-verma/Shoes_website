import React, { useState, useEffect } from 'react';
import './ProductForm.css';

function ProductForm({ selectedProduct, onAddProduct, onUpdateProduct, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'men',
    price: '',
    description: '',
    image: '',
    specifications: {
      weight: '',
      drop: '',
      energy: ''
    },
    features: [''],
    badge: '',
    badgeColor: 'primary',
    stock: 10,
    status: 'active',
    featured: false
  });

  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        ...selectedProduct,
        specifications: selectedProduct.specifications || { weight: '', drop: '', energy: '' },
        features: selectedProduct.features?.length ? selectedProduct.features : ['']
      });
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        category: 'men',
        price: '',
        description: '',
        image: '',
        specifications: {
          weight: '',
          drop: '',
          energy: ''
        },
        features: [''],
        badge: '',
        badgeColor: 'primary',
        stock: 10,
        status: 'active',
        featured: false
      });
    }
  }, [selectedProduct]);

  const handleChange = (e) => {
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
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index) => {
    if (formData.features.length > 1) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        features: newFeatures
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      features: formData.features.filter(f => f.trim() !== '') // Remove empty features
    };

    if (selectedProduct) {
      onUpdateProduct(productData);
    } else {
      onAddProduct(productData);
    }
  };

  return (
    <div className="product-form">
      <h2>{selectedProduct ? '✏️ Edit Product' : '➕ Add New Product'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., PHANTOM CARBON V4"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price ($) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="285.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="men">Men's</option>
              <option value="women">Women's</option>
            </select>
          </div>

          <div className="form-group">
            <label>Stock Quantity *</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Image URL *</label>
          <input
            type="url"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://images.unsplash.com/photo-example.jpg"
            required
          />
          <small>Use a high-quality image URL (preferably from Unsplash)</small>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ultra-compressed carbon-plate architecture for maximum propulsion velocity..."
            rows="4"
            required
          />
        </div>

        {/* Specifications */}
        <div className="form-section">
          <h3>Technical Specifications</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Weight</label>
              <input
                type="text"
                name="spec_weight"
                value={formData.specifications.weight}
                onChange={handleChange}
                placeholder="179g"
              />
            </div>
            <div className="form-group">
              <label>Drop</label>
              <input
                type="text"
                name="spec_drop"
                value={formData.specifications.drop}
                onChange={handleChange}
                placeholder="3.2mm"
              />
            </div>
            <div className="form-group">
              <label>Energy Return</label>
              <input
                type="text"
                name="spec_energy"
                value={formData.specifications.energy}
                onChange={handleChange}
                placeholder="+14.8%"
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="form-section">
          <h3>Features</h3>
          {formData.features.map((feature, index) => (
            <div key={index} className="feature-row">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                placeholder={`Feature ${index + 1}`}
              />
              {formData.features.length > 1 && (
                <button 
                  type="button" 
                  className="btn-remove-feature"
                  onClick={() => removeFeature(index)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn-add-feature" onClick={addFeature}>
            + Add Feature
          </button>
        </div>

        {/* Badge and Status */}
        <div className="form-row">
          <div className="form-group">
            <label>Badge</label>
            <input
              type="text"
              name="badge"
              value={formData.badge}
              onChange={handleChange}
              placeholder="LAB VERIFIED"
            />
          </div>
          <div className="form-group">
            <label>Badge Color</label>
            <select
              name="badgeColor"
              value={formData.badgeColor}
              onChange={handleChange}
            >
              <option value="primary">Primary (Orange)</option>
              <option value="secondary">Secondary (Purple)</option>
              <option value="tertiary">Tertiary (Cyan)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
            />
            Featured Product
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {selectedProduct ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;

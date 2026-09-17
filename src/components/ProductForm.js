import React, { useState, useEffect } from 'react';
import './ProductForm.css';

function ProductForm({ selectedProduct, onAddProduct, onUpdateProduct, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    category: 'men',
    description: '',
    image: '',
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['Black', 'White'],
    stock: 10
  });

  useEffect(() => {
    if (selectedProduct) {
      setFormData(selectedProduct);
    }
  }, [selectedProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock)
    };

    if (selectedProduct) {
      onUpdateProduct({ ...productData, id: selectedProduct.id });
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
            placeholder="e.g., Air Max 270"
            required
          />
        </div>

        <div className="form-group">
          <label>Brand *</label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="e.g., Nike, Adidas"
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
              placeholder="99.99"
              step="0.01"
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
              <option value="men">Men</option>
              <option value="women">Women</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Image URL *</label>
          <input
            type="url"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/shoe.jpg"
            required
          />
          <small>Paste an image URL from the internet</small>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Product description..."
            rows="4"
            required
          />
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

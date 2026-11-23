import React, { useState, useEffect, useCallback } from 'react';
import './CategoriesManager.css';
import categoryService from '../../services/categoryService';
import uploadService from '../../services/uploadService';

function CategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📦',
    color: '#c9232d',
    slug: '',
    image: '',
    isActive: true,
    featured: false,
    displayOrder: 0,
    subcategories: '',
    seoTitle: '',
    seoDescription: ''
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const res = await categoryService.getCategories({ all: 'true' });
    if (res.success) {
      setCategories(res.data || []);
    } else {
      showToast(res.message || 'Failed to load categories', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openAddForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '📦',
      color: '#c9232d',
      slug: '',
      image: '',
      isActive: true,
      featured: false,
      displayOrder: categories.length + 1,
      subcategories: '',
      seoTitle: '',
      seoDescription: ''
    });
    setEditingCategory(null);
    setShowForm(true);
  };

  const openEditForm = (cat) => {
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      icon: cat.icon || '📦',
      color: cat.color || '#c9232d',
      slug: cat.slug || '',
      image: cat.image || '',
      isActive: cat.isActive !== undefined ? cat.isActive : true,
      featured: cat.featured || false,
      displayOrder: cat.displayOrder || 0,
      subcategories: Array.isArray(cat.subcategories) ? cat.subcategories.join(', ') : '',
      seoTitle: cat.seoTitle || '',
      seoDescription: cat.seoDescription || ''
    });
    setEditingCategory(cat);
    setShowForm(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const res = await uploadService.uploadImage(file);
    setIsUploading(false);

    if (res.success && res.data?.url) {
      setFormData(prev => ({ ...prev, image: res.data.url }));
      showToast('Image uploaded successfully!', 'success');
    } else {
      showToast(res.message || 'Image upload failed', 'error');
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setIsSaving(true);
    const subcatArray = formData.subcategories
      ? formData.subcategories.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const payload = {
      ...formData,
      subcategories: subcatArray,
      displayOrder: Number(formData.displayOrder) || 0
    };

    let res;
    if (editingCategory) {
      const catId = editingCategory._id || editingCategory.id;
      res = await categoryService.updateCategory(catId, payload);
    } else {
      res = await categoryService.createCategory(payload);
    }

    setIsSaving(false);
    if (res.success) {
      showToast(res.message || (editingCategory ? 'Category updated!' : 'Category created!'), 'success');
      setShowForm(false);
      setEditingCategory(null);
      loadCategories();
    } else {
      showToast(res.message || 'Failed to save category', 'error');
    }
  };

  const handleDelete = async (cat) => {
    const catId = cat._id || cat.id;
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    const res = await categoryService.deleteCategory(catId);
    if (res.success) {
      showToast(res.message || 'Category deleted successfully', 'success');
      if (selectedCategory && (selectedCategory._id === catId || selectedCategory.id === catId)) {
        setSelectedCategory(null);
      }
      loadCategories();
    } else {
      showToast(res.message || 'Failed to delete category', 'error');
    }
  };

  const handleToggleActive = async (cat) => {
    const catId = cat._id || cat.id;
    const res = await categoryService.toggleCategoryStatus(catId, !cat.isActive);
    if (res.success) {
      showToast(`Category ${!cat.isActive ? 'activated' : 'hidden'}`, 'success');
      loadCategories();
    } else {
      showToast(res.message || 'Status update failed', 'error');
    }
  };

  const activeCount = categories.filter(c => c.isActive).length;
  const featuredCount = categories.filter(c => c.featured).length;

  return (
    <div className="catm-page">
      {toast && (
        <div className={`catm-toast catm-toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="catm-header">
        <div>
          <h1 className="catm-title">Categories Management</h1>
          <p className="catm-subtitle">
            {categories.length} categories · {activeCount} active · {featuredCount} featured · Connected to MongoDB
          </p>
        </div>
        <button className="catm-add-btn" onClick={openAddForm}>+ Add Category</button>
      </div>

      {/* Stats Bar */}
      <div className="catm-stats">
        <div className="catm-stat">
          <div className="catm-stat-val">{categories.length}</div>
          <div className="catm-stat-label">Total Categories</div>
        </div>
        <div className="catm-stat">
          <div className="catm-stat-val">{activeCount}</div>
          <div className="catm-stat-label">Active / Live</div>
        </div>
        <div className="catm-stat">
          <div className="catm-stat-val">{featuredCount}</div>
          <div className="catm-stat-label">Featured</div>
        </div>
        <div className="catm-stat">
          <div className="catm-stat-val">{categories.filter(c => !c.isActive).length}</div>
          <div className="catm-stat-label">Hidden</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          Loading categories from database...
        </div>
      ) : (
        /* Category Grid */
        <div className="catm-grid">
          {categories.map(cat => (
            <div
              key={cat._id || cat.id}
              className={`catm-card ${!cat.isActive ? 'catm-card-inactive' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              <div className="catm-card-top" style={{ background: `${cat.color || '#c9232d'}15`, borderTop: `3px solid ${cat.color || '#c9232d'}` }}>
                <div className="catm-card-icon" style={{ background: cat.color || '#c9232d' }}>{cat.icon || '👟'}</div>
                <div className="catm-card-badges">
                  {cat.featured && <span className="catm-badge-featured">⭐ Featured</span>}
                  {!cat.isActive && <span className="catm-badge-hidden">Hidden</span>}
                </div>
              </div>
              <div className="catm-card-body">
                <h3 className="catm-card-name">{cat.name}</h3>
                <p className="catm-card-desc">{cat.description || 'No description provided.'}</p>
                
                <div style={{ fontSize: '0.8rem', color: '#888', margin: '0.5rem 0' }}>
                  <strong>{cat.productCount || 0}</strong> products assigned
                </div>

                <div className="catm-subcats">
                  {(cat.subcategories || []).slice(0, 3).map(s => (
                    <span key={s} className="catm-subcat">{s}</span>
                  ))}
                  {(cat.subcategories || []).length > 3 && (
                    <span className="catm-subcat catm-subcat-more">+{cat.subcategories.length - 3}</span>
                  )}
                </div>
              </div>
              <div className="catm-card-footer" onClick={e => e.stopPropagation()}>
                <button
                  className="catm-card-btn"
                  title={cat.isActive ? 'Hide Category' : 'Publish Category'}
                  onClick={() => handleToggleActive(cat)}
                >
                  {cat.isActive ? '👁️' : '🚫'}
                </button>
                <button
                  className="catm-card-btn"
                  title="Edit Category"
                  onClick={() => openEditForm(cat)}
                >
                  ✏️
                </button>
                <button
                  className="catm-card-btn catm-card-btn-del"
                  title="Delete Category"
                  onClick={() => handleDelete(cat)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="catm-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="catm-modal" onClick={e => e.stopPropagation()}>
            <div className="catm-modal-header">
              <h2>{editingCategory ? `Edit: ${editingCategory.name}` : 'Create New Category'}</h2>
              <button className="catm-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="catm-form">
              <div className="catm-form-row">
                <div className="catm-form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. TRAIL, RACING, BASKETBALL"
                    required
                  />
                </div>
                <div className="catm-form-group">
                  <label>Slug (URL identifier)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="e.g. trail, racing"
                  />
                </div>
              </div>

              <div className="catm-form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the footwear styles and focus of this category..."
                />
              </div>

              <div className="catm-form-row">
                <div className="catm-form-group">
                  <label>Icon / Emoji</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="👟"
                  />
                </div>
                <div className="catm-form-group">
                  <label>Accent Color</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      style={{ width: '40px', height: '36px', padding: 0, cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <div className="catm-form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={e => setFormData({ ...formData, displayOrder: e.target.value })}
                  />
                </div>
              </div>

              <div className="catm-form-group">
                <label>Category Banner Image URL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://... or upload below"
                    style={{ flex: 1 }}
                  />
                  <label className="catm-card-btn" style={{ cursor: 'pointer', padding: '6px 12px' }}>
                    {isUploading ? 'Uploading...' : '📁 Upload'}
                    <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div className="catm-form-group">
                <label>Subcategories (comma separated)</label>
                <input
                  type="text"
                  value={formData.subcategories}
                  onChange={e => setFormData({ ...formData, subcategories: e.target.value })}
                  placeholder="Road Running, Tempo, Marathon"
                />
              </div>

              <div className="catm-form-row" style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <strong>Active (Visible in Store)</strong>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                  />
                  <strong>Featured in Navigation</strong>
                </label>
              </div>

              <div className="catm-modal-actions">
                <button type="button" className="catm-btn-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="catm-btn-save" disabled={isSaving}>
                  {isSaving ? 'Saving to Database...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesManager;

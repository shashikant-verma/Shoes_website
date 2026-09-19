import React, { useState } from 'react';
import './CategoriesManager.css';

// Static category data — shoe store categories with stats
const DEFAULT_CATEGORIES = [
  {
    id: 'men',
    name: 'MEN',
    description: 'Men\'s footwear collection including running, training, trail, and lifestyle shoes.',
    icon: '👟',
    color: '#1e40af',
    slug: 'men',
    subcategories: ['Running', 'Training', 'Trail', 'Lifestyle', 'Road Racing'],
    isActive: true,
    productCount: 0,
    featured: true
  },
  {
    id: 'women',
    name: 'WOMEN',
    description: 'Women\'s footwear collection crafted for performance and everyday style.',
    icon: '👠',
    color: '#be185d',
    slug: 'women',
    subcategories: ['Running', 'Training', 'Trail', 'Lifestyle'],
    isActive: true,
    productCount: 0,
    featured: true
  },
  {
    id: 'running',
    name: 'RUNNING',
    description: 'High-performance running shoes engineered for speed and endurance.',
    icon: '🏃',
    color: '#c9232d',
    slug: 'running',
    subcategories: ['Road Running', 'Road Racing', 'Tempo'],
    isActive: true,
    productCount: 0,
    featured: true
  },
  {
    id: 'training',
    name: 'TRAINING',
    description: 'Versatile training footwear built for gym workouts and cross-training.',
    icon: '💪',
    color: '#d97706',
    slug: 'training',
    subcategories: ['Gym', 'Cross Training', 'HIIT'],
    isActive: true,
    productCount: 0,
    featured: false
  },
  {
    id: 'trail',
    name: 'TRAIL',
    description: 'Rugged trail running shoes designed for off-road adventures.',
    icon: '🌲',
    color: '#16a34a',
    slug: 'trail',
    subcategories: ['Trail Running', 'Hiking', 'All Terrain'],
    isActive: true,
    productCount: 0,
    featured: false
  },
  {
    id: 'ozark',
    name: 'OZARK',
    description: 'The OZARK collection — rugged outdoor and adventure footwear for all conditions.',
    icon: '⛰️',
    color: '#78350f',
    slug: 'ozark',
    subcategories: ['Trail Running', 'Hiking & Trek', 'All Weather', 'Rugged Boots'],
    isActive: true,
    productCount: 0,
    featured: true
  },
  {
    id: 'accessories',
    name: 'ACCESSORIES',
    description: 'Footwear accessories — socks, insoles, laces and shoe care products.',
    icon: '🎽',
    color: '#6d28d9',
    slug: 'accessories',
    subcategories: ['Socks', 'Insoles', 'Shoe Care', 'Laces'],
    isActive: true,
    productCount: 0,
    featured: false
  },
  {
    id: 'sale',
    name: 'SALE',
    description: 'Discounted footwear and seasonal sale items.',
    icon: '🏷️',
    color: '#dc2626',
    slug: 'sale',
    subcategories: ['Clearance', 'Season End', 'Bundle Deals'],
    isActive: true,
    productCount: 0,
    featured: false
  }
];

function CategoriesManager() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', icon: '📦', color: '#c9232d', slug: '', isActive: true, featured: false,
    subcategories: ''
  });

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAddForm = () => {
    setFormData({ name: '', description: '', icon: '📦', color: '#c9232d', slug: '', isActive: true, featured: false, subcategories: '' });
    setEditingCategory(null);
    setShowForm(true);
  };

  const openEditForm = (cat) => {
    setFormData({
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      color: cat.color,
      slug: cat.slug,
      isActive: cat.isActive,
      featured: cat.featured,
      subcategories: cat.subcategories.join(', ')
    });
    setEditingCategory(cat);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) { showToast('Category name is required', 'error'); return; }

    const subcatArray = formData.subcategories.split(',').map(s => s.trim()).filter(Boolean);
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');

    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? {
        ...c, ...formData, slug, subcategories: subcatArray
      } : c));
      showToast('Category updated successfully!', 'success');
    } else {
      const newCat = {
        id: slug + '-' + Date.now(),
        ...formData,
        slug,
        subcategories: subcatArray,
        productCount: 0
      };
      setCategories(prev => [...prev, newCat]);
      showToast('Category created successfully!', 'success');
    }
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleDelete = (catId) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
    if (selectedCategory?.id === catId) setSelectedCategory(null);
    showToast('Category deleted', 'success');
  };

  const handleToggleActive = (catId) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, isActive: !c.isActive } : c));
    if (selectedCategory?.id === catId) {
      setSelectedCategory(prev => ({ ...prev, isActive: !prev.isActive }));
    }
  };

  const handleToggleFeatured = (catId) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, featured: !c.featured } : c));
    if (selectedCategory?.id === catId) {
      setSelectedCategory(prev => ({ ...prev, featured: !prev.featured }));
    }
  };

  const activeCount = categories.filter(c => c.isActive).length;
  const featuredCount = categories.filter(c => c.featured).length;

  return (
    <div className="catm-page">
      {toast && <div className={`catm-toast catm-toast-${toast.type}`}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}

      {/* Header */}
      <div className="catm-header">
        <div>
          <h1 className="catm-title">Categories</h1>
          <p className="catm-subtitle">{categories.length} categories · {activeCount} active · {featuredCount} featured</p>
        </div>
        <button className="catm-add-btn" onClick={openAddForm}>+ Add Category</button>
      </div>

      {/* Stats */}
      <div className="catm-stats">
        <div className="catm-stat"><div className="catm-stat-val">{categories.length}</div><div className="catm-stat-label">Total</div></div>
        <div className="catm-stat"><div className="catm-stat-val">{activeCount}</div><div className="catm-stat-label">Active</div></div>
        <div className="catm-stat"><div className="catm-stat-val">{featuredCount}</div><div className="catm-stat-label">Featured</div></div>
        <div className="catm-stat"><div className="catm-stat-val">{categories.filter(c => !c.isActive).length}</div><div className="catm-stat-label">Hidden</div></div>
      </div>

      {/* Category Grid */}
      <div className="catm-grid">
        {categories.map(cat => (
          <div
            key={cat.id}
            className={`catm-card ${!cat.isActive ? 'catm-card-inactive' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            <div className="catm-card-top" style={{ background: `${cat.color}15`, borderTop: `3px solid ${cat.color}` }}>
              <div className="catm-card-icon" style={{ background: cat.color }}>{cat.icon}</div>
              <div className="catm-card-badges">
                {cat.featured && <span className="catm-badge-featured">⭐ Featured</span>}
                {!cat.isActive && <span className="catm-badge-hidden">Hidden</span>}
              </div>
            </div>
            <div className="catm-card-body">
              <h3 className="catm-card-name">{cat.name}</h3>
              <p className="catm-card-desc">{cat.description}</p>
              <div className="catm-subcats">
                {cat.subcategories.slice(0, 3).map(s => (
                  <span key={s} className="catm-subcat">{s}</span>
                ))}
                {cat.subcategories.length > 3 && (
                  <span className="catm-subcat catm-subcat-more">+{cat.subcategories.length - 3}</span>
                )}
              </div>
            </div>
            <div className="catm-card-footer" onClick={e => e.stopPropagation()}>
              <button
                className="catm-card-btn"
                onClick={() => openEditForm(cat)}
                title="Edit"
              >✏️</button>
              <button
                className={`catm-card-btn ${cat.isActive ? 'btn-hide' : 'btn-show'}`}
                onClick={() => handleToggleActive(cat.id)}
                title={cat.isActive ? 'Hide' : 'Show'}
              >{cat.isActive ? '👁' : '🙈'}</button>
              <button
                className={`catm-card-btn ${cat.featured ? 'btn-unfeature' : 'btn-feature'}`}
                onClick={() => handleToggleFeatured(cat.id)}
                title={cat.featured ? 'Unfeature' : 'Feature'}
              >{cat.featured ? '★' : '☆'}</button>
              <button
                className="catm-card-btn btn-delete"
                onClick={() => handleDelete(cat.id)}
                title="Delete"
              >🗑️</button>
            </div>
          </div>
        ))}

        {/* Add Card */}
        <div className="catm-card catm-add-card" onClick={openAddForm}>
          <div className="catm-add-icon">+</div>
          <p>Add New Category</p>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="catm-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="catm-modal" onClick={e => e.stopPropagation()}>
            <div className="catm-modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'New Category'}</h2>
              <button className="catm-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="catm-modal-body">
              <div className="catm-form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. MEN, WOMEN, RUNNING..."
                  className="catm-input"
                />
              </div>
              <div className="catm-form-row">
                <div className="catm-form-group">
                  <label>Icon / Emoji</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))}
                    placeholder="📦"
                    className="catm-input"
                  />
                </div>
                <div className="catm-form-group">
                  <label>Accent Color</label>
                  <div className="catm-color-row">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                      className="catm-color-input"
                    />
                    <span className="catm-color-val">{formData.color}</span>
                  </div>
                </div>
              </div>
              <div className="catm-form-group">
                <label>URL Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))}
                  placeholder="auto-generated from name"
                  className="catm-input"
                />
              </div>
              <div className="catm-form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of this category..."
                  className="catm-textarea"
                  rows={3}
                />
              </div>
              <div className="catm-form-group">
                <label>Subcategories <span className="catm-hint">(comma-separated)</span></label>
                <input
                  type="text"
                  value={formData.subcategories}
                  onChange={e => setFormData(p => ({ ...p, subcategories: e.target.value }))}
                  placeholder="Running, Trail, Lifestyle..."
                  className="catm-input"
                />
              </div>
              <div className="catm-form-checkboxes">
                <label className="catm-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))}
                  />
                  <span>Active (visible on storefront)</span>
                </label>
                <label className="catm-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={e => setFormData(p => ({ ...p, featured: e.target.checked }))}
                  />
                  <span>Featured (show in homepage)</span>
                </label>
              </div>
              <div className="catm-form-actions">
                <button className="catm-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="catm-btn-save" onClick={handleSave}>
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Detail Modal */}
      {selectedCategory && !showForm && (
        <div className="catm-modal-overlay" onClick={() => setSelectedCategory(null)}>
          <div className="catm-modal" onClick={e => e.stopPropagation()}>
            <div className="catm-modal-header" style={{ background: selectedCategory.color, color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>{selectedCategory.icon}</span>
                <div>
                  <h2 style={{ margin: 0, color: '#fff' }}>{selectedCategory.name}</h2>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>/{selectedCategory.slug}</p>
                </div>
              </div>
              <button className="catm-modal-close" style={{ color: '#fff' }} onClick={() => setSelectedCategory(null)}>✕</button>
            </div>
            <div className="catm-modal-body">
              <p style={{ color: '#555', fontSize: '14px', marginTop: 0 }}>{selectedCategory.description}</p>
              <div className="catm-detail-row">
                <label>Status</label>
                <span className={selectedCategory.isActive ? 'catm-active' : 'catm-inactive'}>
                  {selectedCategory.isActive ? '● Active' : '○ Hidden'}
                </span>
              </div>
              <div className="catm-detail-row">
                <label>Featured</label>
                <span>{selectedCategory.featured ? '⭐ Yes' : '— No'}</span>
              </div>
              <div className="catm-detail-row">
                <label>Subcategories</label>
                <div className="catm-subcats" style={{ marginTop: '0.25rem' }}>
                  {selectedCategory.subcategories.map(s => <span key={s} className="catm-subcat">{s}</span>)}
                </div>
              </div>
              <div className="catm-modal-actions-row">
                <button className="catm-btn-edit" onClick={() => { openEditForm(selectedCategory); setSelectedCategory(null); }}>✏️ Edit</button>
                <button
                  className={selectedCategory.isActive ? 'catm-btn-hide' : 'catm-btn-show'}
                  onClick={() => handleToggleActive(selectedCategory.id)}
                >
                  {selectedCategory.isActive ? '🙈 Hide' : '👁 Show'}
                </button>
                <button className="catm-btn-delete" onClick={() => { handleDelete(selectedCategory.id); setSelectedCategory(null); }}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesManager;

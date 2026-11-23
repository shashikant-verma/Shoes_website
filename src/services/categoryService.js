import api from './api';

const categoryService = {
  // Get all categories (public or admin with all=true)
  getCategories: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/categories${queryParams ? `?${queryParams}` : ''}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch categories',
        data: []
      };
    }
  },

  // Get single category by slug or id
  getCategory: async (identifier) => {
    try {
      const response = await api.get(`/categories/${identifier}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch category'
      };
    }
  },

  // Create new category (Admin)
  createCategory: async (categoryData) => {
    try {
      const response = await api.post('/categories', categoryData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create category'
      };
    }
  },

  // Update existing category (Admin)
  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update category'
      };
    }
  },

  // Toggle active/inactive status (Admin)
  toggleCategoryStatus: async (id, isActive) => {
    try {
      const response = await api.put(`/categories/${id}/status`, { isActive });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update category status'
      };
    }
  },

  // Delete category (Admin, with orphan product protection)
  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete category'
      };
    }
  }
};

export default categoryService;

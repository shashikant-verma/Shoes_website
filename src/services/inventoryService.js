import api from './api';

const inventoryService = {
  // Get inventory dashboard data & paginated product table (Admin)
  getInventory: async (params = {}) => {
    try {
      const urlParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          urlParams.append(key, value);
        }
      });

      const response = await api.get(`/admin/inventory?${urlParams.toString()}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch inventory data'
      };
    }
  },

  // Get low stock products (Admin)
  getLowStockProducts: async () => {
    try {
      const response = await api.get('/admin/inventory/low-stock');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch low stock products'
      };
    }
  },

  // Get single product inventory details (Admin)
  getProductInventory: async (productId) => {
    try {
      const response = await api.get(`/admin/inventory/${productId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch product inventory details'
      };
    }
  },

  // Adjust product stock (Admin)
  adjustStock: async (productId, adjustmentData) => {
    try {
      const response = await api.post(`/admin/inventory/${productId}/adjust`, adjustmentData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to adjust stock'
      };
    }
  },

  // Get inventory transaction history for a product (Admin)
  getInventoryHistory: async (productId, params = {}) => {
    try {
      const urlParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          urlParams.append(key, value);
        }
      });

      const response = await api.get(`/admin/inventory/${productId}/history?${urlParams.toString()}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch inventory history'
      };
    }
  }
};

export default inventoryService;

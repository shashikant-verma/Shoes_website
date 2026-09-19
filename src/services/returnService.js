import api from './api';

const returnService = {
  // Submit new return request (Customer)
  createReturn: async (returnData) => {
    try {
      const response = await api.post('/returns', returnData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit return request'
      };
    }
  },

  // Get authenticated customer's return requests
  getMyReturns: async () => {
    try {
      const response = await api.get('/returns/my');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch return requests',
        data: { data: [] }
      };
    }
  },

  // Get single return request by ID
  getReturn: async (id) => {
    try {
      const response = await api.get(`/returns/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch return request details'
      };
    }
  },

  // Cancel return request (Customer)
  cancelReturn: async (id) => {
    try {
      const response = await api.put(`/returns/${id}/cancel`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to cancel return request'
      };
    }
  },

  // Get all return requests (Admin)
  getAllReturns: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/returns/admin/all?${params.toString()}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch return requests',
        data: { data: [] }
      };
    }
  },

  // Update return status (Admin)
  updateReturnStatus: async (id, statusData) => {
    try {
      const response = await api.put(`/returns/admin/${id}/status`, statusData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update return status'
      };
    }
  },

  // Process Razorpay refund (Admin)
  processRefund: async (id) => {
    try {
      const response = await api.post(`/returns/admin/${id}/refund`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process Razorpay refund'
      };
    }
  }
};

export default returnService;

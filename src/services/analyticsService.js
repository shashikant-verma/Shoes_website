import api from './api';

const analyticsService = {
  getOverview: async (params = {}) => {
    try {
      const urlParams = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/analytics/overview?${urlParams}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch analytics overview' };
    }
  },

  getSalesTrend: async (params = {}) => {
    try {
      const urlParams = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/analytics/sales-trend?${urlParams}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch sales trend' };
    }
  },

  getTopProducts: async (params = {}) => {
    try {
      const urlParams = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/analytics/top-products?${urlParams}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch top products' };
    }
  },

  getCategoryPerformance: async (params = {}) => {
    try {
      const urlParams = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/analytics/category-performance?${urlParams}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch category performance' };
    }
  },

  getCustomerStats: async (params = {}) => {
    try {
      const urlParams = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/analytics/customer-stats?${urlParams}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch customer analytics' };
    }
  },

  getCouponStats: async (params = {}) => {
    try {
      const urlParams = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/analytics/coupon-stats?${urlParams}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch coupon analytics' };
    }
  },

  getReturnsStats: async (params = {}) => {
    try {
      const urlParams = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/analytics/returns-stats?${urlParams}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch returns analytics' };
    }
  },

  getInventoryStats: async () => {
    try {
      const response = await api.get('/admin/analytics/inventory-stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch inventory analytics' };
    }
  },

  exportReport: async (type = 'sales', params = {}) => {
    try {
      const urlParams = new URLSearchParams({ type, ...params }).toString();
      const response = await api.get(`/admin/analytics/export?${urlParams}`, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to export CSV report' };
    }
  }
};

export default analyticsService;

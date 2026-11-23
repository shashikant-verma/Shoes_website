import api from './api';

const settingsService = {
  // Get public store settings
  getSettings: async () => {
    try {
      const response = await api.get('/settings');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load store settings'
      };
    }
  },

  // Update store settings (Admin only)
  updateSettings: async (settingsData) => {
    try {
      const response = await api.put('/settings', settingsData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update store settings'
      };
    }
  }
};

export default settingsService;

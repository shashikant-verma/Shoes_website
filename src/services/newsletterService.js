import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const newsletterService = {
  subscribe: async ({ email, source = 'storefront' }) => {
    try {
      const response = await axios.post(`${API_URL}/newsletter/subscribe`, {
        email,
        source
      });
      return response.data;
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Unable to process subscription. Please try again.'
      };
    }
  }
};

export default newsletterService;

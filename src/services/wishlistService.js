import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const wishlistService = {
  getWishlist: async () => {
    try {
      const response = await axios.get(`${API_URL}/wishlist`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch wishlist'
      };
    }
  },

  addToWishlist: async (productId) => {
    try {
      const response = await axios.post(`${API_URL}/wishlist`, { productId }, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add to wishlist'
      };
    }
  },

  removeFromWishlist: async (productId) => {
    try {
      const response = await axios.delete(`${API_URL}/wishlist/${productId}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove from wishlist'
      };
    }
  },

  clearWishlist: async () => {
    try {
      const response = await axios.delete(`${API_URL}/wishlist`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to clear wishlist'
      };
    }
  }
};

export default wishlistService;

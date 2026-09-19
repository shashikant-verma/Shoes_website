import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const addressService = {
  getAddresses: async () => {
    try {
      const response = await axios.get(`${API_URL}/addresses`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch addresses'
      };
    }
  },

  createAddress: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/addresses`, data, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating address:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create address'
      };
    }
  },

  updateAddress: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}/addresses/${id}`, data, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error updating address:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update address'
      };
    }
  },

  deleteAddress: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/addresses/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error deleting address:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete address'
      };
    }
  },

  setDefaultAddress: async (id) => {
    try {
      const response = await axios.put(`${API_URL}/addresses/${id}/default`, {}, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error setting default address:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to set default address'
      };
    }
  }
};

export default addressService;

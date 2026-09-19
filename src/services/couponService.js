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

const couponService = {
  // Validate coupon against cart items (Customer)
  validateCoupon: async ({ code, cartItems }) => {
    try {
      const headers = authService.getToken() ? getAuthHeaders().headers : {};
      const response = await axios.post(
        `${API_URL}/coupons/validate`,
        { code, cartItems },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error validating coupon:', error);
      return {
        success: false,
        valid: false,
        message: error.response?.data?.message || 'Invalid coupon code'
      };
    }
  },

  // Admin: Get all coupons
  getAllCouponsAdmin: async () => {
    try {
      const response = await axios.get(`${API_URL}/coupons/admin/all`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching admin coupons:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch coupons',
        data: []
      };
    }
  },

  // Admin: Create new coupon
  createCouponAdmin: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/coupons/admin`, data, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating coupon:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create coupon'
      };
    }
  },

  // Admin: Update coupon
  updateCouponAdmin: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}/coupons/admin/${id}`, data, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error updating coupon:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update coupon'
      };
    }
  },

  // Admin: Delete coupon
  deleteCouponAdmin: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/coupons/admin/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error deleting coupon:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete coupon'
      };
    }
  }
};

export default couponService;

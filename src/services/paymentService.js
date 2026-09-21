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

const paymentService = {
  // Get available shipping methods
  getShippingMethods: async (subtotal, address) => {
    try {
      const response = await axios.get(`${API_URL}/shipping/methods`, {
        params: { subtotal, address: JSON.stringify(address || {}) },
        ...getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load shipping methods'
      };
    }
  },

  // Calculate exact shipping fee
  calculateShipping: async ({ subtotal, method, address }) => {
    try {
      const response = await axios.post(
        `${API_URL}/shipping/calculate`,
        { subtotal, method, address },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to calculate shipping'
      };
    }
  },

  // Step 1: Request server to calculate total & create Razorpay Order
  createPaymentOrder: async ({ items, promoCode, shippingAddress, shippingMethod }) => {
    try {
      const response = await axios.post(
        `${API_URL}/payment/create-order`,
        { items, promoCode, shippingAddress, shippingMethod },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to initiate payment'
      };
    }
  },

  // Step 2: Send payment signature and details to server for verification & order creation
  verifyPayment: async (payload) => {
    try {
      const response = await axios.post(
        `${API_URL}/payment/verify`,
        payload,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Payment verification failed'
      };
    }
  }
};

export default paymentService;

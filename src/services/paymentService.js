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
  // Step 1: Request server to calculate total & create Razorpay Order
  createPaymentOrder: async ({ items, promoCode, shippingAddress }) => {
    try {
      const response = await axios.post(
        `${API_URL}/payment/create-order`,
        { items, promoCode, shippingAddress },
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

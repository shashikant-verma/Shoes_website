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

const reviewService = {
  // Public: Get approved reviews and summary for a product
  getProductReviews: async (productId) => {
    try {
      const response = await axios.get(`${API_URL}/reviews/product/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch reviews',
        summary: { averageRating: 0, reviewCount: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
        data: []
      };
    }
  },

  // Private: Get current user's review and verified purchase eligibility for a product
  getMyReview: async (productId) => {
    try {
      const response = await axios.get(`${API_URL}/reviews/my/${productId}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching user review state:', error);
      return {
        success: false,
        isVerifiedBuyer: false,
        myReview: null
      };
    }
  },

  // Private: Create a new review
  createReview: async ({ productId, rating, title, comment }) => {
    try {
      const response = await axios.post(
        `${API_URL}/reviews`,
        { productId, rating, title, comment },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit review'
      };
    }
  },

  // Private: Update user's existing review
  updateReview: async (id, { rating, title, comment }) => {
    try {
      const response = await axios.put(
        `${API_URL}/reviews/${id}`,
        { rating, title, comment },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update review'
      };
    }
  },

  // Private: Delete review (Owner or Admin)
  deleteReview: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/reviews/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete review'
      };
    }
  },

  // Admin: Get all reviews with status filter
  getAllReviewsAdmin: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/reviews/admin/all`, {
        ...getAuthHeaders(),
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin reviews:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch admin reviews',
        data: []
      };
    }
  },

  // Admin: Approve review
  approveReviewAdmin: async (id) => {
    try {
      const response = await axios.put(
        `${API_URL}/reviews/admin/${id}/approve`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error approving review:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to approve review'
      };
    }
  },

  // Admin: Reject review
  rejectReviewAdmin: async (id) => {
    try {
      const response = await axios.put(
        `${API_URL}/reviews/admin/${id}/reject`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error rejecting review:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reject review'
      };
    }
  }
};

export default reviewService;

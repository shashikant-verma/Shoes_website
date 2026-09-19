import api from './api';

const cartService = {
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch cart' 
      };
    }
  },

  addToCart: async (items) => {
    try {
      const response = await api.post('/cart', { items });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update cart' 
      };
    }
  },

  updateCartItem: async (itemId, quantity) => {
    try {
      const response = await api.put(`/cart/${itemId}`, { quantity });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update item quantity' 
      };
    }
  },

  removeCartItem: async (itemId) => {
    try {
      const response = await api.delete(`/cart/${itemId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to remove item' 
      };
    }
  },

  clearCart: async () => {
    try {
      const response = await api.delete('/cart');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to clear cart' 
      };
    }
  }
};

export default cartService;

import api from './api';

const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message ||
          (error.request ? 'Cannot connect to the backend. Start MongoDB and the API server.' : 'Login failed')
      };
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get profile'
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const auth = localStorage.getItem('auth');
    if (!auth) return false;
    
    try {
      const { token, user } = JSON.parse(auth);
      return !!(token && user);
    } catch {
      return false;
    }
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const auth = localStorage.getItem('auth');
    if (!auth) return null;
    
    try {
      const { user } = JSON.parse(auth);
      return user;
    } catch {
      return null;
    }
  },

  // Store auth data in localStorage
  setAuth: (authData) => {
    localStorage.setItem('auth', JSON.stringify(authData));
  },

  // Clear auth data
  clearAuth: () => {
    localStorage.removeItem('auth');
  }
};

export default authService;
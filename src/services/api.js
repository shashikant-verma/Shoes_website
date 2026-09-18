import axios from 'axios';
import API_CONFIG from '../config/api.config';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Connection retry logic
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Request interceptor to add auth token and retry logic
api.interceptors.request.use(
  async (config) => {
    const auth = localStorage.getItem('auth');
    if (auth) {
      const { token } = JSON.parse(auth);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling with retry
api.interceptors.response.use(
  (response) => {
    // Reset retry count on successful response
    retryCount = 0;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors (backend not responding)
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
      if (retryCount < MAX_RETRIES && !originalRequest._retry) {
        retryCount++;
        originalRequest._retry = true;
        
        console.log(`🔄 Backend connection failed, retrying... (${retryCount}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY * retryCount);
        
        return api(originalRequest);
      }
      
      // All retries failed
      console.error('❌ Backend is not responding after multiple attempts');
      throw new Error('Cannot connect to the backend. Start MongoDB and the API server.');
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('auth');
      window.location.href = '/';
    }
    
    // Reset retry count for non-network errors
    retryCount = 0;
    return Promise.reject(error);
  }
);

// Health check function
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${API_CONFIG.BASE_URL.replace('/api', '')}/api/health`, {
      timeout: 5000
    });
    return response.data.status === 'healthy';
  } catch (error) {
    return false;
  }
};

export default api;
// API Configuration
const API_CONFIG = {
  // Default to localhost for development
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  
  // Timeout for API requests
  TIMEOUT: 10000,
  
  // Default headers
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

export default API_CONFIG;
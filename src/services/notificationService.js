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

export const notificationService = {
  // Get notifications with pagination and filtering
  getNotifications: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = `${API_URL}/notifications${query ? `?${query}` : ''}`;
    const response = await fetch(url, getAuthHeaders());
    const data = await response.json();
    return data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await fetch(`${API_URL}/notifications/unread-count`, getAuthHeaders());
    const data = await response.json();
    return data;
  },

  // Mark single notification as read
  markAsRead: async (id) => {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      ...getAuthHeaders()
    });
    const data = await response.json();
    return data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      ...getAuthHeaders()
    });
    const data = await response.json();
    return data;
  }
};

export default notificationService;

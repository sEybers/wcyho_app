import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

class ApiService {
  // Auth
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Save auth data in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data.user;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  async register(userData) {
    try {
      const response = await api.post('/users', userData);
      
      // Save auth data in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data.user;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }
  
  logout() {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Check if user is logged in
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  // Add getCurrentUser method
  getCurrentUser() {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (token && user) {
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
  
  // Refresh user data
  async refreshUserData() {
    if (!this.isAuthenticated()) return null;
    
    try {
      const response = await api.get('/auth');
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired or invalid
        this.logout();
      }
      return null;
    }
  }

  // Schedules
  async getSchedules() {
    const response = await api.get('/schedules');
    return response.data;
  }

  async createSchedule(name) {
    const response = await api.post('/schedules', { name });
    return response.data;
  }

  async updateSchedule(id, data) {
    try {
      console.log('Updating schedule:', id, 'with data:', data);
      const response = await api.put(`/schedules/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('API updateSchedule error:', error.response?.data || error.message);
      throw error;
    }
  }

  async deleteSchedule(id) {
    await api.delete(`/schedules/${id}`);
  }

  // Friends
  async getFriends() {
    const response = await api.get('/friends');
    return response.data;
  }

  async getFriendsWithSchedules() {
    const response = await api.get('/friends/with-schedules');
    return response.data;
  }

  async searchUsers(query, field = 'username') {
    const response = await api.get(`/users/search?query=${query}&field=${field}`);
    return response.data;
  }

  async getFriendRequests() {
    const response = await api.get('/friends/requests');
    return response.data;
  }

  async sendFriendRequest(userId) {
    await api.post(`/friends/request/${userId}`);
  }

  async acceptFriendRequest(userId) {
    await api.put(`/friends/accept/${userId}`);
  }

  async rejectFriendRequest(userId) {
    await api.delete(`/friends/reject/${userId}`);
  }

  async cancelFriendRequest(userId) {
    await api.delete(`/friends/cancel/${userId}`);
  }

  async removeFriend(userId) {
    await api.delete(`/friends/${userId}`);
  }

  // User Settings
  async getUserSettings() {
    const response = await api.get('/users/settings');
    return response.data;
  }

  async updatePrimarySchedule(scheduleId) {
    const response = await api.put('/users/settings/primary-schedule', { scheduleId });
    return response.data;
  }
}

export const apiService = new ApiService();
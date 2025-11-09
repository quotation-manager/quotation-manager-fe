import api from './api';
import { API_ROUTES } from '../constants';

export const authService = {
  // Login user
  login: async (email, password) => {
    const response = await api.post(API_ROUTES.INTERNAL.AUTH.LOGIN, {
      email,
      password,
    });

    if (response.data.success) {
      const { user, token } = response.data.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return response.data;
    }

    throw new Error(response.data.message || 'Login failed');
  },

  // Logout user
  logout: async () => {
    try {
      // Call logout API if needed
      await api.post(API_ROUTES.INTERNAL.AUTH.LOGOUT);
    } catch (error) {
      // Even if API fails, clear local storage
      // eslint-disable-next-line no-console
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  },

  // Get token from localStorage
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

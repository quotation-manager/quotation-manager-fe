import api from './api';
import { API_ROUTES } from '../constants';

export const userService = {
  // Get all users with pagination and search
  getUsers: async (params = {}) => {
    const { page = 1, limit = 10, name = '' } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(name && { name }),
    }).toString();

    const response = await api.get(
      `${API_ROUTES.INTERNAL.USERS.LIST}?${queryParams}`
    );
    return response.data;
  },

  // Get user by ID
  getUserById: async id => {
    const response = await api.get(
      `${API_ROUTES.INTERNAL.USERS.GET_BY_ID}/${id}`
    );
    return response.data;
  },

  // Create new user
  createUser: async userData => {
    const response = await api.post(API_ROUTES.INTERNAL.USERS.CREATE, userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(
      `${API_ROUTES.INTERNAL.USERS.UPDATE}/${id}`,
      userData
    );
    return response.data;
  },

  // Delete user
  deleteUser: async id => {
    const response = await api.delete(
      `${API_ROUTES.INTERNAL.USERS.DELETE}/${id}`
    );
    return response.data;
  },

  // Change password
  changePassword: async passwordData => {
    const response = await api.post(
      API_ROUTES.INTERNAL.USERS.CHANGE_PASSWORD,
      passwordData
    );
    return response.data;
  },
};

import axios from 'axios';
import { notification } from 'antd';
import { API_ROUTES, ERROR_MESSAGES } from '../constants';
import store from '../store';
import { logoutUser } from '../store/slices/authSlice';

// Create axios instance
const api = axios.create({
  baseURL: API_ROUTES.INTERNAL.BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and auth
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const { response } = error;

    // Handle unauthorized/forbidden responses
    if (response?.status === 401 || response?.status === 403) {
      // Don't logout for login API
      const isLoginApi = response?.config?.url?.includes('/auth/login');

      if (!isLoginApi) {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Dispatch logout action
        store.dispatch(logoutUser());

        // Show notification
        notification.error({
          message: 'Session Expired',
          description: 'Your session has expired. Please login again.',
          duration: 5,
        });

        // Redirect to login
        window.location.href = '/login';
      }
    }

    // Handle other errors
    if (response?.data?.message) {
      notification.error({
        message: 'Error',
        description: response.data.message,
        duration: 5,
      });
    } else {
      notification.error({
        message: 'Error',
        description: ERROR_MESSAGES.SOMETHING_WENT_WRONG,
        duration: 5,
      });
    }

    return Promise.reject(error);
  }
);

export default api;

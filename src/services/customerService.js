import api from './api';
import { API_ROUTES } from '../constants';

export const customerService = {
  // Get all customers with pagination and search
  getCustomers: async (params = {}) => {
    const { page = 1, limit = 10, search = '', reference_id = '' } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(reference_id && { reference_id }),
    }).toString();

    const response = await api.get(
      `${API_ROUTES.INTERNAL.CUSTOMERS.LIST}?${queryParams}`
    );
    return response.data;
  },

  // Get customer by ID
  getCustomerById: async id => {
    const response = await api.get(
      `${API_ROUTES.INTERNAL.CUSTOMERS.GET_BY_ID}/${id}`
    );
    return response.data;
  },

  // Create new customer
  createCustomer: async customerData => {
    const response = await api.post(
      API_ROUTES.INTERNAL.CUSTOMERS.CREATE,
      customerData
    );
    return response.data;
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    const response = await api.put(
      `${API_ROUTES.INTERNAL.CUSTOMERS.UPDATE}/${id}`,
      customerData
    );
    return response.data;
  },

  // Delete customer
  deleteCustomer: async id => {
    const response = await api.delete(
      `${API_ROUTES.INTERNAL.CUSTOMERS.DELETE}/${id}`
    );
    return response.data;
  },
};

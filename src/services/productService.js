import api from './api';
import { API_ROUTES } from '../constants';

export const productService = {
  // Get all products with pagination and search
  getProducts: async (params = {}) => {
    const response = await api.get(API_ROUTES.INTERNAL.PRODUCTS.LIST, {
      params,
    });
    return response;
  },

  // Get a single product by ID
  getProductById: async id => {
    const response = await api.get(
      `${API_ROUTES.INTERNAL.PRODUCTS.GET_BY_ID}/${id}`
    );
    return response;
  },

  // Create a new product
  createProduct: async productData => {
    const response = await api.post(
      API_ROUTES.INTERNAL.PRODUCTS.CREATE,
      productData
    );
    return response;
  },

  // Update an existing product
  updateProduct: async (id, productData) => {
    const response = await api.put(
      `${API_ROUTES.INTERNAL.PRODUCTS.UPDATE}/${id}`,
      productData
    );
    return response;
  },

  // Delete a product
  deleteProduct: async id => {
    const response = await api.delete(
      `${API_ROUTES.INTERNAL.PRODUCTS.DELETE}/${id}`
    );
    return response;
  },

  // Get all units
  getUnits: async () => {
    const response = await api.get(API_ROUTES.INTERNAL.PRODUCTS.UNITS);
    return response;
  },
};

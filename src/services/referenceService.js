import api from './api';
import { API_ROUTES } from '../constants';

export const referenceService = {
  // Get all references with pagination, search, and category filter
  getReferences: async (params = {}) => {
    const { page = 1, limit = 10, search = '', category = '' } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(category && { category }),
    }).toString();

    const response = await api.get(
      `${API_ROUTES.INTERNAL.REFERENCES.LIST}?${queryParams}`
    );
    return response.data;
  },

  // Get reference by ID
  getReferenceById: async id => {
    const response = await api.get(
      `${API_ROUTES.INTERNAL.REFERENCES.GET_BY_ID}/${id}`
    );
    return response.data;
  },

  // Create new reference
  createReference: async referenceData => {
    const response = await api.post(
      API_ROUTES.INTERNAL.REFERENCES.CREATE,
      referenceData
    );
    return response.data;
  },

  // Update reference
  updateReference: async (id, referenceData) => {
    const response = await api.put(
      `${API_ROUTES.INTERNAL.REFERENCES.UPDATE}/${id}`,
      referenceData
    );
    return response.data;
  },

  // Delete reference
  deleteReference: async id => {
    const response = await api.delete(
      `${API_ROUTES.INTERNAL.REFERENCES.DELETE}/${id}`
    );
    return response.data;
  },

  // Get all categories
  getCategories: async () => {
    const response = await api.get(API_ROUTES.INTERNAL.REFERENCES.CATEGORIES);
    return response.data;
  },
};

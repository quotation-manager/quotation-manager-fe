import api from './api';
import { API_ROUTES } from '../constants';

export const locationService = {
  // Get all locations with pagination and search
  getLocations: async (params = {}) => {
    const response = await api.get(API_ROUTES.INTERNAL.LOCATIONS.LIST, {
      params,
    });
    return response;
  },

  // Get a single location by ID
  getLocationById: async id => {
    const response = await api.get(
      `${API_ROUTES.INTERNAL.LOCATIONS.GET_BY_ID}/${id}`
    );
    return response;
  },

  // Create a new location
  createLocation: async locationData => {
    const response = await api.post(
      API_ROUTES.INTERNAL.LOCATIONS.CREATE,
      locationData
    );
    return response;
  },

  // Update an existing location
  updateLocation: async (id, locationData) => {
    const response = await api.put(
      `${API_ROUTES.INTERNAL.LOCATIONS.UPDATE}/${id}`,
      locationData
    );
    return response;
  },

  // Delete a location
  deleteLocation: async id => {
    const response = await api.delete(
      `${API_ROUTES.INTERNAL.LOCATIONS.DELETE}/${id}`
    );
    return response;
  },
};

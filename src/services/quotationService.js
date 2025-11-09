import api from './api';
import { API_ROUTES } from '../constants';

export const quotationService = {
  getQuotations: async (params = {}) => {
    const response = await api.get(API_ROUTES.INTERNAL.QUOTATIONS.LIST, {
      params,
    });
    return response;
  },

  getQuotationById: async id => {
    const response = await api.get(
      `${API_ROUTES.INTERNAL.QUOTATIONS.GET_BY_ID}/${id}`
    );
    return response;
  },

  getPublicQuotationById: async id => {
    const response = await api.get(
      `${API_ROUTES.INTERNAL.QUOTATIONS.GET_BY_ID}/public/${id}`
    );
    return response;
  },

  createQuotation: async quotationData => {
    const response = await api.post(
      API_ROUTES.INTERNAL.QUOTATIONS.CREATE,
      quotationData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response;
  },

  updateQuotation: async (id, quotationData) => {
    const response = await api.put(
      `${API_ROUTES.INTERNAL.QUOTATIONS.UPDATE}/${id}`,
      quotationData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response;
  },

  markSharedDate: async id => {
    const response = await api.patch(
      `${API_ROUTES.INTERNAL.QUOTATIONS.UPDATE}/${id}/shared-date`,
      {}
    );
    return response;
  },

  deleteQuotation: async id => {
    const response = await api.delete(
      `${API_ROUTES.INTERNAL.QUOTATIONS.DELETE}/${id}`
    );
    return response;
  },

  regeneratePDF: async id => {
    const response = await api.post(
      `${API_ROUTES.INTERNAL.QUOTATIONS.REGENERATE_PDF}/${id}/regenerate-pdf`
    );
    return response;
  },
};

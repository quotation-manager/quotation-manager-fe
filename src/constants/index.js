// API Routes
export const API_ROUTES = {
  // External API routes
  EXTERNAL: {
    WEATHER_API: 'https://api.weatherapi.com/v1',
    GEOCODING_API: 'https://api.geocoding.com/v1',
  },
  // Internal API routes
  INTERNAL: {
    BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
    AUTH: {
      LOGIN: '/v1/auth/login',
      LOGOUT: '/v1/auth/logout',
      REFRESH: '/v1/auth/refresh',
    },
    USERS: {
      BASE: '/v1/users',
      LIST: '/v1/users',
      CREATE: '/v1/users',
      UPDATE: '/v1/users', // append /:id
      DELETE: '/v1/users', // append /:id
      GET_BY_ID: '/v1/users', // append /:id
      CHANGE_PASSWORD: '/v1/users/change-password',
    },
    REFERENCES: {
      BASE: '/v1/references',
      LIST: '/v1/references',
      CREATE: '/v1/references',
      UPDATE: '/v1/references', // append /:id
      DELETE: '/v1/references', // append /:id
      GET_BY_ID: '/v1/references', // append /:id
      CATEGORIES: '/v1/references/categories',
    },
    CUSTOMERS: {
      BASE: '/v1/customers',
      LIST: '/v1/customers',
      CREATE: '/v1/customers',
      UPDATE: '/v1/customers', // append /:id
      DELETE: '/v1/customers', // append /:id
      GET_BY_ID: '/v1/customers', // append /:id
    },
    PRODUCTS: {
      BASE: '/v1/products',
      LIST: '/v1/products',
      CREATE: '/v1/products',
      UPDATE: '/v1/products', // append /:id
      DELETE: '/v1/products', // append /:id
      GET_BY_ID: '/v1/products', // append /:id
      UNITS: '/v1/products/units',
    },
    LOCATIONS: {
      BASE: '/v1/locations',
      LIST: '/v1/locations',
      CREATE: '/v1/locations',
      UPDATE: '/v1/locations', // append /:id
      DELETE: '/v1/locations', // append /:id
      GET_BY_ID: '/v1/locations', // append /:id
    },
    QUOTATIONS: {
      BASE: '/v1/quotations',
      LIST: '/v1/quotations',
      CREATE: '/v1/quotations',
      UPDATE: '/v1/quotations', // append /:id (also /:id/shared-date)
      DELETE: '/v1/quotations', // append /:id
      GET_BY_ID: '/v1/quotations', // append /:id
      REGENERATE_PDF: '/v1/quotations', // append /:id/regenerate-pdf
    },
  },
};

// Timeouts and Limits
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  SESSION: 3600000, // 1 hour
  DEBOUNCE: 300, // 300ms
};

export const LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_UPLOAD_FILES: 10,
  PAGINATION_LIMIT: 10,
  SEARCH_MIN_LENGTH: 2,
};

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  DEFAULT_LIMIT_FOR_REFERENCES: 1000,
  PAGE_SIZE_OPTIONS: ['10', '20', '50', '100'],
  SHOW_SIZE_CHANGER: true,
  SHOW_QUICK_JUMPER: true,
};

// User Role Constants
export const USER_ROLES = {
  ADMIN: 1,
  EMPLOYEE: 2,
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.EMPLOYEE]: 'Employee',
};

// Public assets base URL (S3 or CDN)
export const ASSET_BASE_URL = process.env.REACT_APP_S3_STORAGE_BUCKET_URL || '';

// Price Type Constants
export const PRICE_TYPES = {
  INCLUSIVE_TAX: 'Inclusive Tax',
  EXCLUSIVE_TAX: 'Exclusive Tax',
};

export const PRICE_TYPE_OPTIONS = [
  { value: 'Inclusive Tax', label: 'Inclusive Tax' },
  { value: 'Exclusive Tax', label: 'Exclusive Tax' },
];

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SOMETHING_WENT_WRONG: 'Something went wrong.',
};

// Utility function to extract error message from API response
export const getErrorMessage = error => {
  const errorData = error.response?.data;

  // If it's a validation error and has errors array, use the first error message
  if (
    errorData?.message === 'Validation error' &&
    errorData?.errors &&
    errorData.errors.length > 0
  ) {
    return errorData.errors[0].message || errorData.message;
  }

  // Otherwise use the general message or fallback
  return errorData?.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG;
};

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'Data saved successfully.',
  DELETE_SUCCESS: 'Item deleted successfully.',
  UPDATE_SUCCESS: 'Data updated successfully.',
  LOGIN_SUCCESS: 'Login successful.',
  LOGOUT_SUCCESS: 'Logout successful.',
  REGISTER_SUCCESS: 'Registration successful.',
  USER_CREATED: 'User created successfully.',
  USER_UPDATED: 'User updated successfully.',
  USER_DELETED: 'User deleted successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  REFERENCE_CREATED: 'Reference created successfully.',
  REFERENCE_UPDATED: 'Reference updated successfully.',
  REFERENCE_DELETED: 'Reference deleted successfully.',
  CUSTOMER_CREATED: 'Customer created successfully.',
  CUSTOMER_UPDATED: 'Customer updated successfully.',
  CUSTOMER_DELETED: 'Customer deleted successfully.',
  PRODUCT_CREATED: 'Product created successfully.',
  PRODUCT_UPDATED: 'Product updated successfully.',
  PRODUCT_DELETED: 'Product deleted successfully.',
  LOCATION_CREATED: 'Location created successfully.',
  LOCATION_UPDATED: 'Location updated successfully.',
  LOCATION_DELETED: 'Location deleted successfully.',
  QUOTATION_CREATED: 'Quotation created successfully.',
  QUOTATION_UPDATED: 'Quotation updated successfully.',
  QUOTATION_DELETED: 'Quotation deleted successfully.',
};

// Date formatting utility
export const formatDate = date => {
  if (!date) return 'N/A';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
};

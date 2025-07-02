import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Check for new token in response headers (token refresh)
    const newToken = response.headers['x-new-token'];
    if (newToken && typeof window !== 'undefined') {
      localStorage.setItem('token', newToken);
    }
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
          break;
        case 403:
          toast.error('Access forbidden - insufficient permissions');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 422:
          // Validation errors
          if (data.details && Array.isArray(data.details)) {
            data.details.forEach(error => {
              toast.error(`${error.param}: ${error.msg}`);
            });
          } else {
            toast.error(data.error || 'Validation failed');
          }
          break;
        case 429:
          toast.error('Too many requests - please slow down');
          break;
        case 500:
          toast.error('Server error - please try again later');
          break;
        default:
          toast.error(data.error || 'An error occurred');
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout - please try again');
    } else if (error.message === 'Network Error') {
      toast.error('Network error - please check your connection');
    } else {
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// API service methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  register: (userData) => api.post('/auth/register', userData),
};

export const surveysAPI = {
  getAll: (params) => api.get('/surveys', { params }),
  getById: (id) => api.get(`/surveys/${id}`),
  create: (data) => api.post('/surveys', data),
  update: (id, data) => api.put(`/surveys/${id}`, data),
  delete: (id) => api.delete(`/surveys/${id}`),
  getResponses: (id, params) => api.get(`/surveys/${id}/responses`, { params }),
};

export const tokensAPI = {
  getAll: (params) => api.get('/tokens', { params }),
  create: (data) => api.post('/tokens', data),
  pause: (id) => api.patch(`/tokens/${id}/pause`),
  resume: (id) => api.patch(`/tokens/${id}/resume`),
  delete: (id) => api.delete(`/tokens/${id}`),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const logsAPI = {
  getAll: (params) => api.get('/logs', { params }),
  getSummary: () => api.get('/logs/summary'),
  getFilters: () => api.get('/logs/filters'),
};

export const widgetsAPI = {
  getConfig: (tokenId) => api.get(`/widgets/${tokenId}/config`),
  submitResponse: (tokenId, data) => api.post(`/widgets/${tokenId}/response`, data),
};

export default api; 
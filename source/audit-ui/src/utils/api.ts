import axios from 'axios';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


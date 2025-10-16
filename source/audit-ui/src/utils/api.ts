import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5001';

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

// Handle structured responses and errors
api.interceptors.response.use(
  (response) => {
    // Extract data from structured response
    if (response.data && response.data.status === 'SUCCESS') {
      // Keep the full response but make data easily accessible
      response.data.success = true;
    }
    return response;
  },
  (error: AxiosError<any>) => {
    // Handle structured error responses
    if (error.response?.data?.status === 'FAILED') {
      const errorData = error.response.data;
      error.message = errorData.message || error.message;
      
      // Log detailed error in development
      if (errorData.debug) {
        console.error('API Error Details:', errorData.debug);
      }
    }

    // Handle 401 - redirect to login (only once)
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Prevent multiple redirects by checking if we're already redirecting
      if (!window.location.pathname.includes('/login')) {
        console.warn('Authentication failed. Redirecting to login...');
        localStorage.clear();
        
        // Use replace instead of href to prevent back button issues
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  }
);

// Helper to extract data from structured response
export function extractData<T>(response: any): T {
  return response.data?.data || response.data;
}

// Helper to extract pagination metadata
export function extractPagination(response: any) {
  return response.data?.meta?.pagination || null;
}

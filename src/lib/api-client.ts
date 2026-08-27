import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token injection
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage or cookie
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token && config.headers) {
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
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    // Handle different error status codes
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login or refresh token
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden
          console.error('Access denied');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 500:
          // Server error
          console.error('Server error occurred');
          break;
        default:
          console.error('An error occurred:', data?.error?.message || error.message);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error - please check your connection');
    } else {
      // Error setting up request
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper methods for common API operations
export const api = {
  get: <T>(url: string, config?: object) => 
    apiClient.get<ApiResponse<T>>(url, config),
  
  post: <T>(url: string, data?: unknown, config?: object) => 
    apiClient.post<ApiResponse<T>>(url, data, config),
  
  put: <T>(url: string, data?: unknown, config?: object) => 
    apiClient.put<ApiResponse<T>>(url, data, config),
  
  patch: <T>(url: string, data?: unknown, config?: object) => 
    apiClient.patch<ApiResponse<T>>(url, data, config),
  
  delete: <T>(url: string, config?: object) => 
    apiClient.delete<ApiResponse<T>>(url, config),
};

export default apiClient;

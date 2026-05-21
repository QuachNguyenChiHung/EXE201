import axios, { type AxiosInstance, AxiosError, type InternalAxiosRequestConfig } from 'axios';

// API Base URL - configure this based on your environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('auth_token');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response: any) => {
        return response;
    },
    (error: AxiosError) => {
        // Handle specific error cases
        if (error.response) {
            const status = error.response.status;

            switch (status) {
                case 401:
                    // Unauthorized - clear token and redirect to login
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    break;

                case 403:
                    console.error('Access forbidden');
                    break;

                case 404:
                    console.error('Resource not found');
                    break;

                case 500:
                    console.error('Internal server error');
                    break;

                default:
                    console.error('API Error:', error.response.data);
            }
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;

// Helper function to set auth token
export const setAuthToken = (token: string | null) => {
    if (token) {
        localStorage.setItem('auth_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        localStorage.removeItem('auth_token');
        delete api.defaults.headers.common['Authorization'];
    }
};

// Helper function to get auth token
export const getAuthToken = (): string | null => {
    return localStorage.getItem('auth_token');
};

// Helper function to clear auth
export const clearAuth = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
};

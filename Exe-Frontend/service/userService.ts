import api from './api';
import type {
    User,
    LoginCredentials,
    RegisterData,
    AuthResponse,
    ApiResponse
} from '../model/types';

export const userService = {
    // Auth endpoints
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    logout: async (): Promise<void> => {
        await api.post('/auth/logout');
    },

    // User endpoints
    getCurrentUser: async (): Promise<User> => {
        const response = await api.get<User>('/users/me');
        return response.data;
    },

    getUserById: async (id: string): Promise<User> => {
        const response = await api.get<User>(`/users/${id}`);
        return response.data;
    },

    updateUser: async (id: string, data: Partial<User>): Promise<User> => {
        const response = await api.put<User>(`/users/${id}`, data);
        return response.data;
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
        const response = await api.put<User>('/users/me', data);
        return response.data;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
        const response = await api.post<ApiResponse<void>>('/users/change-password', {
            currentPassword,
            newPassword,
        });
        return response.data;
    },

    deleteAccount: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`);
    },
};

import api from './api';
import type {
    Warehouse,
    PaginatedResponse,
    ApiResponse
} from '../model/types';

export interface WarehouseSearchParams {
    city?: string;
    province?: string;
    minCapacity?: number;
    maxCapacity?: number;
    minPrice?: number;
    maxPrice?: number;
    temperatureMin?: number;
    temperatureMax?: number;
    securityLevel?: string;
    hasCertification?: boolean;
    availability?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
}

export const warehouseService = {
    // Get all warehouses with filters
    getWarehouses: async (params?: WarehouseSearchParams): Promise<PaginatedResponse<Warehouse>> => {
        const response = await api.get<PaginatedResponse<Warehouse>>('/warehouses', { params });
        return response.data;
    },

    // Get single warehouse by ID
    getWarehouseById: async (id: string): Promise<Warehouse> => {
        const response = await api.get<Warehouse>(`/warehouses/${id}`);
        return response.data;
    },

    // Create new warehouse
    createWarehouse: async (data: Partial<Warehouse>): Promise<Warehouse> => {
        const response = await api.post<Warehouse>('/warehouses', data);
        return response.data;
    },

    // Update warehouse
    updateWarehouse: async (id: string, data: Partial<Warehouse>): Promise<Warehouse> => {
        const response = await api.put<Warehouse>(`/warehouses/${id}`, data);
        return response.data;
    },

    // Delete warehouse
    deleteWarehouse: async (id: string): Promise<void> => {
        await api.delete(`/warehouses/${id}`);
    },

    // Get warehouses by owner
    getMyWarehouses: async (): Promise<Warehouse[]> => {
        const response = await api.get<Warehouse[]>('/warehouses/my');
        return response.data;
    },

    // Update warehouse status
    updateWarehouseStatus: async (id: string, status: string): Promise<Warehouse> => {
        const response = await api.patch<Warehouse>(`/warehouses/${id}/status`, { status });
        return response.data;
    },

    // Update warehouse availability
    updateAvailability: async (id: string, availability: string): Promise<Warehouse> => {
        const response = await api.patch<Warehouse>(`/warehouses/${id}/availability`, { availability });
        return response.data;
    },

    // Upload warehouse images
    uploadImages: async (id: string, files: File[]): Promise<string[]> => {
        const formData = new FormData();
        files.forEach(file => formData.append('images', file));

        const response = await api.post<string[]>(`/warehouses/${id}/images`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Delete warehouse image
    deleteImage: async (id: string, imageUrl: string): Promise<void> => {
        await api.delete(`/warehouses/${id}/images`, { data: { imageUrl } });
    },

    // Get featured/recommended warehouses
    getFeaturedWarehouses: async (): Promise<Warehouse[]> => {
        const response = await api.get<Warehouse[]>('/warehouses/featured');
        return response.data;
    },

    // Search warehouses with AI
    aiSearch: async (query: string): Promise<Warehouse[]> => {
        const response = await api.post<Warehouse[]>('/warehouses/ai-search', { query });
        return response.data;
    },
};

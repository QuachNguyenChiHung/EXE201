import { api } from './asus_api';
import { WarehouseResponseDTO } from '../types/employee';
import type { CompositeWarehouse } from '../types';

export interface FilterMetaResponseDTO {
    locations: string[];
    statuses: string[];
    sponsorTiers: any[];
    certifications: any[];
}

export interface RentRequestDetailCreateDTO {
    sectionId: number;
    priceTierId: number;
    rentedArea: number;
    areaUnit: string;
}

export interface RentRequestCreateDTO {
    warehouseId: number;
    cargoDescription: string;
    otherDetail: string;
    duration: number;
    durationUnit: string;
    renterOfferedPrice: number | null;
    details: RentRequestDetailCreateDTO[];
}

const mapPriceTiers = (tiers: any[]) => {
    return (tiers || []).map((pt: any) => {
        let timeUnit = pt.unit;
        const labelStr = (pt.label || "").toLowerCase();
        if (labelStr.includes('tháng') || labelStr.includes('month')) timeUnit = 'month';
        else if (labelStr.includes('ngày') || labelStr.includes('day')) timeUnit = 'day';
        else if (labelStr.includes('tuần') || labelStr.includes('week')) timeUnit = 'week';
        else if (labelStr.includes('năm') || labelStr.includes('year')) timeUnit = 'year';
        
        return {
            ...pt,
            timeUnit: timeUnit, // explicitly set derived time unit
            areaUnit: pt.areaUnit || pt.area_unit || 'm3',
        };
    });
};

const mapWarehouseResponse = (w: any): CompositeWarehouse => {
    return {
        ...w,
        id_warehouse: w.id_warehouse || w.id,
        location_province: w.location_province || w.locationProvince,
        location_commune: w.location_commune || w.locationCommune,
        location_address_text: w.location_address_text || w.locationAddressText,
        status: (w.status || "").toLowerCase(),
        certifications: w.certifications || w.certificates || [],
        images: (w.images || []).map((img: any) => ({
            ...img,
            image_url: img.image_url || img.imageUrl
        })),
        priceTiers: mapPriceTiers(w.priceTiers),
        sections: (w.sections || []).map((s: any) => ({
            ...s,
            id_section: s.id_section || s.id,
            total_capacity: s.total_capacity || s.totalCapacity,
            available_capacity: s.available_capacity || s.availableCapacity,
            temp_min: s.temp_min || s.tempMin,
            temp_max: s.temp_max || s.tempMax,
            priceTiers: mapPriceTiers(s.priceTiers)
        })),
    };
};

export interface RenterStatisticResponseDTO {
    totalWarehouseWithActiveContract: number;
    totalAiConversation: number;
    totalTokenUsage: number;
    totalBilling: number;
    aiSubscriptionInUse: string;
    totalRentRequest: number;
    totalOwnerUpdatedRequest: number;
    totalActiveContract: number;
    endOfContract: number;
}

export const renterService = {
    getDashboardStatistics: async (expireDays: number = 30): Promise<RenterStatisticResponseDTO> => {
        console.log(`[API CALL] GET /renters/statistics?expireDays=${expireDays}`);
        const response = await api.get('/renters/statistics', { params: { expireDays } });
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },

    createRentRequest: async (request: RentRequestCreateDTO): Promise<any> => {
        console.log(`[API CALL] POST /renters/requests`, request);
        const response = await api.post('/renters/requests', request);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },

    getMyRequests: async (page: number = 0, size: number = 6, status?: string): Promise<{ content: any[], totalPages: number, totalElements: number }> => {
        console.log(`[API CALL] GET /renters/requests?page=${page}&size=${size}&status=${status || ''}`);
        const params: any = { page, size };
        if (status) params.status = status;
        const response = await api.get('/renters/requests', { params });
        console.log('[API RESPONSE]', response.data);
        return {
            content: response.data.content || [],
            totalPages: response.data.totalPages || 0,
            totalElements: response.data.totalElements || 0
        };
    },

    cancelRequest: async (requestId: number, reason?: string): Promise<any> => {
        console.log(`[API CALL] PATCH /renters/requests/${requestId}/cancel`);
        const response = await api.patch(`/renters/requests/${requestId}/cancel`, { reason });
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },

    toggleBookmark: async (warehouseId: number): Promise<string> => {
        const response = await api.post(`/renters/bookmarks/${warehouseId}`);
        return response.data;
    },

    getMyBookmarks: async (): Promise<CompositeWarehouse[]> => {
        const response = await api.get('/renters/bookmarks');
        return (response.data || []).map(mapWarehouseResponse);
    },

    getActiveWarehouses: async (page: number = 0, size: number = 6): Promise<{ content: CompositeWarehouse[], totalPages: number, totalElements: number }> => {
        console.log(`[API CALL] GET /warehouses?page=${page}&size=${size}`);
        const response = await api.get('/warehouses', { params: { page, size } });
        console.log('[API RESPONSE]', response.data);
        return {
            content: (response.data.content || []).map(mapWarehouseResponse),
            totalPages: response.data.totalPages || 0,
            totalElements: response.data.totalElements || 0
        };
    },

    getPopularWarehouses: async (page: number = 0, size: number = 6): Promise<{ content: CompositeWarehouse[], totalPages: number, totalElements: number }> => {
        console.log(`[API CALL] GET /warehouses/popular?page=${page}&size=${size}`);
        const response = await api.get('/warehouses/popular', { params: { page, size } });
        console.log('[API RESPONSE]', response.data);
        return {
            content: (response.data.content || []).map(mapWarehouseResponse),
            totalPages: response.data.totalPages || 0,
            totalElements: response.data.totalElements || 0
        };
    },

    searchWarehouses: async (params: any): Promise<{ content: CompositeWarehouse[], totalPages: number, totalElements: number }> => {
        console.log(`[API CALL] GET /warehouses/search`, params);
        const response = await api.get('/warehouses/search', { params });
        console.log('[API RESPONSE]', response.data);
        return {
            content: (response.data.content || []).map(mapWarehouseResponse),
            totalPages: response.data.totalPages || 0,
            totalElements: response.data.totalElements || 0
        };
    },

    getFilterMeta: async (): Promise<FilterMetaResponseDTO> => {
        console.log(`[API CALL] GET /warehouses/filter-meta`);
        const response = await api.get('/warehouses/filter-meta');
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },

    getWarehouseDetail: async (id: string | number): Promise<CompositeWarehouse> => {
        console.log(`[API CALL] GET /warehouses/${id}`);
        const response = await api.get(`/warehouses/${id}`);
        console.log('[API RESPONSE]', response.data);
        return mapWarehouseResponse(response.data);
    },

    getWarehouseLocation: async (id: string | number): Promise<{ locationLat: number, locationLong: number }> => {
        console.log(`[API CALL] GET /warehouses/${id}/location`);
        const response = await api.get(`/warehouses/${id}/location`);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    }
};

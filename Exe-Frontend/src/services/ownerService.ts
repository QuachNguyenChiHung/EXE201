import { api } from './asus_api';
import type { CompositeWarehouse } from '../types';

export interface OwnerStatisticResponseDTO {
  totalWarehouses: number;
  totalCapacity: number;
  totalAvailable: number;
  occupancyRate: number;
  totalPendingRentRequests: number;
  totalActiveContract: number;
  billingThisMonth: number;
  endingContract: number;
}

export const ownerService = {
  getOwnerStatistics: async (): Promise<OwnerStatisticResponseDTO> => {
    console.log('[API CALL] GET /owners/statistics');
    const response = await api.get('/owners/statistics');
    console.log('[API RESPONSE]', response.data);
    return response.data;
  },
  getMyWarehouses: async (page: number = 0, size: number = 10, status?: string): Promise<{ content: CompositeWarehouse[], totalPages: number, totalElements: number }> => {
    const params: any = { page, size };
    if (status && status !== 'all') params.status = status;
    console.log('[API CALL] GET /owners/warehouses', params);
    const response = await api.get('/owners/warehouses', { params });
    console.log('[API RESPONSE]', response.data);
    
    // Map backend DTO to frontend CompositeWarehouse interface
    const dataList = Array.isArray(response.data) ? response.data : (response.data.content || []);
    const mappedContent = dataList.map((w: any) => {
      const availCap = w.sections?.reduce((sum: number, sec: any) => sum + (sec.availableCapacity || 0), 0) || 0;
      const totCap = w.sections?.reduce((sum: number, sec: any) => sum + (sec.totalCapacity || 0), 0) || 0;
      let avail = 'full';
      if (availCap === totCap && totCap > 0) {
        avail = 'available';
      } else if (availCap > 0) {
        avail = 'partially';
      }

      return {
        ...w,
        status: w.status?.toLowerCase(),
        availability: avail,
        id_warehouse: w.id,
        location_province: w.locationProvince,
        location_commune: w.locationCommune,
        location_address_text: w.locationAddressText,
      sections: w.sections?.map((sec: any) => ({
        ...sec,
        id_section: sec.id,
        total_capacity: sec.totalCapacity,
        available_capacity: sec.availableCapacity,
        temp_min: sec.tempMin,
        temp_max: sec.tempMax,
        priceTiers: sec.priceTiers?.map((pt: any) => ({
          ...pt,
          unit: 'month' // Force to 'month' to match frontend price calculation
        }))
      })),
      images: w.images?.map((img: any) => ({
        ...img,
        image_url: img.imageUrl,
        is_thumbnail: img.isThumbnail
      })),
      stats: {
        totalCapacity: w.sections?.reduce((sum: number, sec: any) => sum + (sec.totalCapacity || 0), 0) || 0,
        availableCapacity: w.sections?.reduce((sum: number, sec: any) => sum + (sec.availableCapacity || 0), 0) || 0,
        temperatureMin: w.sections?.length ? Math.min(...w.sections.map((s: any) => s.tempMin)) : 0,
        temperatureMax: w.sections?.length ? Math.max(...w.sections.map((s: any) => s.tempMax)) : 0,
      },
      certifications: w.certificates?.map((c: any) => ({
        ...c,
        id_cerfSubmit: c.id,
        documentUrl: c.link, // Used by MyWarehouseCard
        isVerified: c.status === 'VERIFIED'
      }))
    };
    });
    
    if (response.data && !Array.isArray(response.data)) {
        return {
            content: mappedContent,
            totalPages: response.data.totalPages || 0,
            totalElements: response.data.totalElements || 0,
        };
    }
    return {
        content: mappedContent,
        totalPages: 1,
        totalElements: mappedContent.length,
    };
  },
  hideWarehouse: async (id: number): Promise<any> => {
    console.log(`[API CALL] PATCH /owners/warehouses/${id}/inactive`);
    const response = await api.patch(`/owners/warehouses/${id}/inactive`);
    console.log('[API RESPONSE]', response.data);
    return response.data;
  },
  restoreWarehouse: async (id: number): Promise<any> => {
    console.log(`[API CALL] PATCH /owners/warehouses/${id}/active`);
    const response = await api.patch(`/owners/warehouses/${id}/active`);
    console.log('[API RESPONSE]', response.data);
    return response.data;
  },
  updateWarehouse: async (id: number, payload: any): Promise<any> => {
    console.log(`[API CALL] PUT /owners/warehouses/${id}`);
    const response = await api.put(`/owners/warehouses/${id}`, payload);
    console.log('[API RESPONSE]', response.data);
    return response.data;
  },
  getMyWarehouseDetail: async (id: number): Promise<CompositeWarehouse> => {
    console.log(`[API CALL] GET /owners/warehouses/${id}`);
    const response = await api.get(`/owners/warehouses/${id}`);
    console.log('[API RESPONSE]', response.data);
    const w = response.data;
    
    // Exact same mapping logic as getMyWarehouses
    const availCap = w.sections?.reduce((sum: number, sec: any) => sum + (sec.availableCapacity || 0), 0) || 0;
    const totCap = w.sections?.reduce((sum: number, sec: any) => sum + (sec.totalCapacity || 0), 0) || 0;
    let avail = 'full';
    if (availCap === totCap && totCap > 0) {
      avail = 'available';
    } else if (availCap > 0) {
      avail = 'partially';
    }

    return {
      ...w,
      status: w.status?.toLowerCase(),
      availability: avail,
      id_warehouse: w.id,
      location_province: w.locationProvince,
      location_commune: w.locationCommune,
      location_address_text: w.locationAddressText,
      sections: w.sections?.map((sec: any) => ({
        ...sec,
        id_section: sec.id,
        total_capacity: sec.totalCapacity,
        available_capacity: sec.availableCapacity,
        temp_min: sec.tempMin,
        temp_max: sec.tempMax,
        priceTiers: sec.priceTiers?.map((pt: any) => ({
          ...pt,
          unit: 'month'
        }))
      })),
      images: w.images?.map((img: any) => ({
        ...img,
        image_url: img.imageUrl,
        is_thumbnail: img.isThumbnail
      })),
      stats: {
        totalCapacity: w.sections?.reduce((sum: number, sec: any) => sum + (sec.totalCapacity || 0), 0) || 0,
        availableCapacity: w.sections?.reduce((sum: number, sec: any) => sum + (sec.availableCapacity || 0), 0) || 0,
        temperatureMin: w.sections?.length ? Math.min(...w.sections.map((s: any) => s.tempMin)) : 0,
        temperatureMax: w.sections?.length ? Math.max(...w.sections.map((s: any) => s.tempMax)) : 0,
      },
      certifications: w.certificates?.map((c: any) => ({
        ...c,
        id_cerfSubmit: c.id,
        documentUrl: c.link,
        isVerified: c.status === 'VERIFIED'
      }))
    };
  },
  getWarehouseRatings: async (id: number): Promise<any> => {
    console.log(`[API CALL] GET /owners/warehouses/${id}/ratings`);
    const response = await api.get(`/owners/warehouses/${id}/ratings`);
    console.log('[API RESPONSE]', response.data);
    return response.data;
  },
  getWarehouseViewStats: async (id: number, days: number = 7): Promise<any> => {
    console.log(`[API CALL] GET /warehouses/${id}/view-stats?days=${days}`);
    const response = await api.get(`/warehouses/${id}/view-stats`, { params: { days } });
    console.log('[API RESPONSE]', response.data);
    return response.data;
  },
  getIncomingRequests: async (page: number = 0, size: number = 10, status?: string): Promise<{ content: any[], totalPages: number, totalElements: number }> => {
    const params: any = { page, size };
    if (status && status !== 'all') params.status = status;
    console.log('[API CALL] GET /owners/requests', params);
    const response = await api.get('/owners/requests', { params });
    console.log('[API RESPONSE]', response.data);
    
    if (response.data && !Array.isArray(response.data)) {
        return {
            content: response.data.content || [],
            totalPages: response.data.totalPages || 0,
            totalElements: response.data.totalElements || 0,
        };
    }
    return {
        content: Array.isArray(response.data) ? response.data : [],
        totalPages: 1,
        totalElements: Array.isArray(response.data) ? response.data.length : 0,
    };
  },
  updateRequestStatus: async (id: string, payload: { status: string; offeredPrice?: number; ownerNote?: string; rejectionReason?: string }) => {
    const res = await api.patch(`/owners/requests/${id}/status`, payload);
    return res.data;
  },

  getRequestDetail: async (id: number): Promise<any> => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },
  getWarehouseRentRequests: async (warehouseId: number, status?: string): Promise<any[]> => {
    console.log(`[API CALL] GET /owners/warehouses/${warehouseId}/requests${status ? `?status=${status}` : ''}`);
    const response = await api.get(`/owners/warehouses/${warehouseId}/requests`, { params: status ? { status } : {} });
    console.log('[API RESPONSE]', response.data);
    return response.data;
  },
  getWarehouseContracts: async (warehouseId: number, status?: string): Promise<any[]> => {
    console.log(`[API CALL] GET /owners/warehouses/${warehouseId}/contracts${status ? `?status=${status}` : ''}`);
    const response = await api.get(`/owners/warehouses/${warehouseId}/contracts`, { params: status ? { status } : {} });
    console.log('[API RESPONSE]', response.data);
    return response.data;
  },
  getContracts: async (status?: string, page: number = 0, size: number = 6): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (status && status !== 'ALL') queryParams.append('status', status);
    queryParams.append('page', page.toString());
    queryParams.append('size', size.toString());
    
    console.log(`[API CALL] GET /contracts?${queryParams.toString()}`);
    const response = await api.get(`/contracts`, { params: { status: status && status !== 'ALL' ? status : undefined, page, size } });
    console.log('[API RESPONSE]', response.data);
    return response.data;
  },
  createContract: async (payload: any): Promise<any> => {
    console.log('[API CALL] POST /owners/contracts', payload);
    const response = await api.post('/owners/contracts', payload);
    console.log('[API RESPONSE]', response.data);
    return response.data;
  },
  createWarehouse: async (formData: FormData): Promise<any> => {
    console.log('[API CALL] POST /owners/warehouses (FormData)');
    const response = await api.post('/owners/warehouses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('[API RESPONSE]', response.data);
    return response.data;
  },
  getWarehouseLocation: async (id: number): Promise<{locationLat: number, locationLong: number}> => {
    console.log(`[API CALL] GET /warehouses/${id}/location`);
    const response = await api.get(`/warehouses/${id}/location`);
    console.log('[API RESPONSE]', response.data);
    return response.data;
  }
};


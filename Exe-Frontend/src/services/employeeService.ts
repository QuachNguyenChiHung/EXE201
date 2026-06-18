import { api } from './asus_api';
import { UserDTO, WarehouseEmployeeDTO, WarehouseResponseDTO, RenterDetailResponseDTO, OwnerDetailResponseDTO, ContractResponseDTO, RentRequestResponseDTO } from '../types/employee';

export const employeeService = {
    getAllWarehouses: async (page: number = 0, size: number = 10, status?: string): Promise<{ content: WarehouseEmployeeDTO[], totalPages: number, totalElements: number }> => {
        const params: any = { page, size };
        if (status && status !== 'all') params.status = status;
        console.log('[API CALL] GET /employees/warehouses', params);
        const response = await api.get('/employees/warehouses', { params });
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

    // getAcceptedWarehouses: async (): Promise<WarehouseEmployeeDTO[]> => {
    //     const response = await api.get('/employees/warehouses/accepted');
    //     return response.data;
    // },
    // getHiddenWarehouses: async (): Promise<WarehouseEmployeeDTO[]> => {
    //     const response = await api.get('/employees/warehouses/hidden');
    //     return response.data;
    // },
    acceptWarehouse: async (id: number): Promise<WarehouseEmployeeDTO> => {
        console.log(`[API CALL] PATCH /employees/warehouses/${id}/accept`);
        const response = await api.patch(`/employees/warehouses/${id}/accept`);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    rejectWarehouse: async (id: number): Promise<WarehouseEmployeeDTO> => {
        console.log(`[API CALL] PATCH /employees/warehouses/${id}/rejected`);
        const response = await api.patch(`/employees/warehouses/${id}/rejected`);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getWarehouseDetail: async (id: number): Promise<WarehouseResponseDTO> => {
        console.log(`[API CALL] GET /employees/warehouses/${id}`);
        const response = await api.get(`/employees/warehouses/${id}`);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    // hideWarehouse: async (id: number): Promise<WarehouseEmployeeDTO> => {
    //     const response = await api.patch(`/employees/warehouses/${id}/hidden`);
    //     return response.data;
    // },
    getStatistics: async () => {
        console.log('[API CALL] GET /employees/statistic');
        const response = await api.get('/employees/statistic');
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getUsers: async (page: number = 0, size: number = 10, role?: string, keyword?: string): Promise<{ content: UserDTO[], totalPages: number, totalElements: number }> => {
        const params: any = { page, size };
        if (role && role !== 'all') params.role = role;
        if (keyword) params.keyword = keyword;
        
        console.log('[API CALL] GET /users', params);
        const response = await api.get('/users', { params });
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
    createUser: async (payload: any) => {
        console.log('[API CALL] POST /users', payload);
        const response = await api.post('/users', payload);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    updateUser: async (userID: number, payload: any) => {
        console.log(`[API CALL] PATCH /users/${userID}`, payload);
        const response = await api.patch(`/users/${userID}`, payload);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    updateUserStatus: async (userID: number, status: string) => {
        console.log(`[API CALL] PATCH /users/${userID}/status`, { status });
        const response = await api.patch(`/users/${userID}/status`, { status });
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getCertTypes: async () => {
        console.log('[API CALL] GET /certs');
        const response = await api.get('/certs');
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    createCertType: async (payload: any) => {
        console.log('[API CALL] POST /certs', payload);
        const response = await api.post('/certs', payload);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    updateCertType: async (certID: string, payload: any) => {
        console.log(`[API CALL] PATCH /certs/${certID}`, payload);
        const response = await api.patch(`/certs/${certID}`, payload);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    deleteCertType: async (certID: string) => {
        console.log(`[API CALL] DELETE /certs/${certID}`);
        const response = await api.delete(`/certs/${certID}`);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    reviewWarehouseCertification: async (submitId: number, dto: { status: string, rejectReason?: string, typeId?: number | null }) => {
        console.log(`[API CALL] PATCH /employees/certifications/${submitId}/review`, dto);
        const response = await api.patch(`/employees/certifications/${submitId}/review`, dto);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getRenterDetail: async (userId: number): Promise<RenterDetailResponseDTO> => {
        console.log(`[API CALL] GET /employees/renters/${userId}/detail`);
        const response = await api.get(`/employees/renters/${userId}/detail`);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getOwnerDetail: async (userId: number): Promise<OwnerDetailResponseDTO> => {
        console.log(`[API CALL] GET /employees/owners/${userId}/detail`);
        const response = await api.get(`/employees/owners/${userId}/detail`);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getActiveUsersByDate: async (startDate: string, endDate: string) => {
        console.log(`[API CALL] GET /employees/statistics/active-users/by-date?startDate=${startDate}&endDate=${endDate}`);
        const response = await api.get(`/employees/statistics/active-users/by-date`, { params: { startDate, endDate } });
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getActiveUsersByHour: async (date?: string) => {
        console.log(`[API CALL] GET /employees/statistics/active-users/by-hour${date ? `?date=${date}` : ''}`);
        const response = await api.get(`/employees/statistics/active-users/by-hour`, { params: { date } });
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getContracts: async (status?: string, page: number = 0, size: number = 6): Promise<{ content: ContractResponseDTO[], totalElements: number, totalPages: number }> => {
        const queryParams = new URLSearchParams();
        if (status && status !== 'ALL') queryParams.append('status', status);
        queryParams.append('page', page.toString());
        queryParams.append('size', size.toString());
        
        console.log(`[API CALL] GET /contracts?${queryParams.toString()}`);
        const response = await api.get(`/contracts`, { params: { status: status && status !== 'ALL' ? status : undefined, page, size } });
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getUserActivityStats: async (userId: number, days: number = 7) => {
        console.log(`[API CALL] GET /employees/users/${userId}/activity-stats?days=${days}`);
        const response = await api.get(`/employees/users/${userId}/activity-stats`, { params: { days } });
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getWarehouseViewStats: async (id: number, days: number = 7) => {
        console.log(`[API CALL] GET /warehouses/${id}/view-stats?days=${days}`);
        const response = await api.get(`/warehouses/${id}/view-stats`, { params: { days } });
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getRequestDetail: async (id: number): Promise<RentRequestResponseDTO> => {
        console.log(`[API CALL] GET /requests/${id}`);
        const response = await api.get(`/requests/${id}`);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getContractDetail: async (id: number): Promise<ContractResponseDTO> => {
        console.log(`[API CALL] GET /contracts/${id}`);
        const response = await api.get(`/contracts/${id}`);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    // AI SUBSCRIPTION TIER
    getAllAiTiers: async () => {
        console.log('[API CALL] GET /employees/ai-tiers');
        const response = await api.get('/employees/ai-tiers');
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    createAiTier: async (payload: any) => {
        console.log('[API CALL] POST /employees/ai-tiers', payload);
        const response = await api.post('/employees/ai-tiers', payload);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    updateAiTier: async (id: number, payload: any) => {
        console.log(`[API CALL] PUT /employees/ai-tiers/${id}`, payload);
        const response = await api.put(`/employees/ai-tiers/${id}`, payload);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    deleteAiTier: async (id: number) => {
        console.log(`[API CALL] DELETE /employees/ai-tiers/${id}`);
        const response = await api.delete(`/employees/ai-tiers/${id}`);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    // SPONSOR TIER
    getAllSponsorTiers: async () => {
        console.log('[API CALL] GET /employees/sponsor-tiers');
        const response = await api.get('/employees/sponsor-tiers');
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    createSponsorTier: async (payload: any) => {
        console.log('[API CALL] POST /employees/sponsor-tiers', payload);
        const response = await api.post('/employees/sponsor-tiers', payload);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    updateSponsorTier: async (id: number, payload: any) => {
        console.log(`[API CALL] PUT /employees/sponsor-tiers/${id}`, payload);
        const response = await api.put(`/employees/sponsor-tiers/${id}`, payload);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    deleteSponsorTier: async (id: number) => {
        console.log(`[API CALL] DELETE /employees/sponsor-tiers/${id}`);
        const response = await api.delete(`/employees/sponsor-tiers/${id}`);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    }
};

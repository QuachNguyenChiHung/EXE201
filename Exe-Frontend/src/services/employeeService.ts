import { api } from './asus_api';
import { UserDTO, WarehouseEmployeeDTO, WarehouseResponseDTO, RenterDetailResponseDTO, OwnerDetailResponseDTO, ContractResponseDTO, RentRequestResponseDTO } from '../types/employee';

export const employeeService = {
    getAllWarehouses: async (page: number = 0, size: number = 10, status?: string): Promise<{ content: WarehouseEmployeeDTO[], totalPages: number, totalElements: number }> => {
        const params: any = { page, size };
        if (status && status !== 'all') params.status = status;
        const response = await api.get('/employees/warehouses', { params });
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
        const response = await api.patch(`/employees/warehouses/${id}/accept`);
        return response.data;
    },
    rejectWarehouse: async (id: number): Promise<WarehouseEmployeeDTO> => {
        const response = await api.patch(`/employees/warehouses/${id}/rejected`);
        return response.data;
    },
    getWarehouseDetail: async (id: number): Promise<WarehouseResponseDTO> => {
        const response = await api.get(`/employees/warehouses/${id}`);
        return response.data;
    },
    // hideWarehouse: async (id: number): Promise<WarehouseEmployeeDTO> => {
    //     const response = await api.patch(`/employees/warehouses/${id}/hidden`);
    //     return response.data;
    // },
    getStatistics: async () => {
        const response = await api.get('/employees/statistic');
        return response.data;
    },
    getUsers: async (page: number = 0, size: number = 10, role?: string, keyword?: string): Promise<{ content: UserDTO[], totalPages: number, totalElements: number }> => {
        const params: any = { page, size };
        if (role && role !== 'all') params.role = role;
        if (keyword) params.keyword = keyword;
        
        const response = await api.get('/users', { params });
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
        const response = await api.post('/users', payload);
        return response.data;
    },
    updateUser: async (userID: number, payload: any) => {
        const response = await api.patch(`/users/${userID}`, payload);
        return response.data;
    },
    updateUserStatus: async (userID: number, status: string) => {
        const response = await api.patch(`/users/${userID}/status`, { status });
        return response.data;
    },
    getCertTypes: async () => {
        const response = await api.get('/certs');
        return response.data;
    },
    createCertType: async (payload: any) => {
        const response = await api.post('/certs', payload);
        return response.data;
    },
    updateCertType: async (certID: string, payload: any) => {
        const response = await api.patch(`/certs/${certID}`, payload);
        return response.data;
    },
    deleteCertType: async (certID: string) => {
        const response = await api.delete(`/certs/${certID}`);
        return response.data;
    },
    reviewWarehouseCertification: async (submitId: number, dto: { status: string, rejectReason?: string, typeId?: number | null }) => {
        const response = await api.patch(`/employees/certifications/${submitId}/review`, dto);
        return response.data;
    },
    getRenterDetail: async (userId: number): Promise<RenterDetailResponseDTO> => {
        const response = await api.get(`/employees/renters/${userId}/detail`);
        return response.data;
    },
    getOwnerDetail: async (userId: number): Promise<OwnerDetailResponseDTO> => {
        const response = await api.get(`/employees/owners/${userId}/detail`);
        return response.data;
    },
    getActiveUsersByDate: async (startDate: string, endDate: string) => {
        const response = await api.get(`/employees/statistics/active-users/by-date`, { params: { startDate, endDate } });
        return response.data;
    },
    getActiveUsersByHour: async (date?: string) => {
        const response = await api.get(`/employees/statistics/active-users/by-hour`, { params: { date } });
        return response.data;
    },
    getContracts: async (status?: string, page: number = 0, size: number = 6): Promise<{ content: ContractResponseDTO[], totalElements: number, totalPages: number }> => {
        const response = await api.get(`/contracts`, { params: { status: status && status !== 'ALL' ? status : undefined, page, size } });
        return response.data;
    },
    getUserActivityStats: async (userId: number, days: number = 7) => {
        const response = await api.get(`/employees/users/${userId}/activity-stats`, { params: { days } });
        return response.data;
    },
    getWarehouseViewStats: async (id: number, days: number = 7) => {
        const response = await api.get(`/warehouses/${id}/view-stats`, { params: { days } });
        return response.data;
    },
    getRequestDetail: async (id: number): Promise<RentRequestResponseDTO> => {
        const response = await api.get(`/requests/${id}`);
        return response.data;
    },
    getContractDetail: async (id: number): Promise<ContractResponseDTO> => {
        const response = await api.get(`/contracts/${id}`);
        return response.data;
    },
    // AI SUBSCRIPTION TIER
    getAllAiTiers: async () => {
        const response = await api.get('/employees/ai-tiers');
        return response.data;
    },
    createAiTier: async (payload: any) => {
        const response = await api.post('/employees/ai-tiers', payload);
        return response.data;
    },
    updateAiTier: async (id: number, payload: any) => {
        const response = await api.put(`/employees/ai-tiers/${id}`, payload);
        return response.data;
    },
    deleteAiTier: async (id: number) => {
        const response = await api.delete(`/employees/ai-tiers/${id}`);
        return response.data;
    },
    // SPONSOR TIER
    getAllSponsorTiers: async () => {
        const response = await api.get('/employees/sponsor-tiers');
        return response.data;
    },
    createSponsorTier: async (payload: any) => {
        const response = await api.post('/employees/sponsor-tiers', payload);
        return response.data;
    },
    updateSponsorTier: async (id: number, payload: any) => {
        const response = await api.put(`/employees/sponsor-tiers/${id}`, payload);
        return response.data;
    },
    deleteSponsorTier: async (id: number) => {
        const response = await api.delete(`/employees/sponsor-tiers/${id}`);
        return response.data;
    }
};

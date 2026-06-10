import { api } from './asus_api';
import { UserDTO, WarehouseEmployeeDTO, WarehouseResponseDTO, RenterDetailResponseDTO, OwnerDetailResponseDTO } from '../types/employee';

export const employeeService = {
    getAllWarehouses: async (): Promise<WarehouseEmployeeDTO[]> => {
        console.log('[API CALL] GET /employees/warehouses');
        const response = await api.get('/employees/warehouses');
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getPendingWarehouses: async (): Promise<WarehouseEmployeeDTO[]> => {
        console.log('[API CALL] GET /employees/warehouses/pending');
        const response = await api.get('/employees/warehouses/pending');
        console.log('[API RESPONSE]', response.data);
        return response.data;
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
    getUsers: async (): Promise<UserDTO[]> => {
        console.log('[API CALL] GET /employees/users');
        const response = await api.get('/employees/users');
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    createUser: async (payload: any) => {
        console.log('[API CALL] POST /users', payload);
        const response = await api.post('/users', payload);
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
    reviewWarehouseCertification: async (submitId: number, dto: { isVerified: boolean, typeId?: number | null }) => {
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
    getContracts: async (status?: string) => {
        console.log(`[API CALL] GET /contracts${status ? `?status=${status}` : ''}`);
        const response = await api.get(`/contracts`, { params: status && status !== 'ALL' ? { status } : undefined });
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
    getRequestDetail: async (id: number) => {
        console.log(`[API CALL] GET /requests/${id}`);
        const response = await api.get(`/requests/${id}`);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    },
    getContractDetail: async (id: number) => {
        console.log(`[API CALL] GET /contracts/${id}`);
        const response = await api.get(`/contracts/${id}`);
        console.log('[API RESPONSE]', response.data);
        return response.data;
    }
};

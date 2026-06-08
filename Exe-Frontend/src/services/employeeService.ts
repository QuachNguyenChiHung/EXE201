import { api } from './asus_api';

export const employeeService = {
    getAllWarehouses: async () => {
        const response = await api.get('/employees/warehouses');
        return response.data;
    },
    getPendingWarehouses: async () => {
        const response = await api.get('/employees/warehouses/pending');
        return response.data;
    },
    getAcceptedWarehouses: async () => {
        const response = await api.get('/employees/warehouses/accepted');
        return response.data;
    },
    getHiddenWarehouses: async () => {
        const response = await api.get('/employees/warehouses/hidden');
        return response.data;
    },
    acceptWarehouse: async (id: number) => {
        const response = await api.patch(`/employees/warehouses/${id}/accept`);
        return response.data;
    },
    rejectWarehouse: async (id: number) => {
        const response = await api.patch(`/employees/warehouses/${id}/rejected`);
        return response.data;
    },
    hideWarehouse: async (id: number) => {
        const response = await api.patch(`/employees/warehouses/${id}/hidden`);
        return response.data;
    },
    getStatistics: async () => {
        const response = await api.get('/employees/statistic');
        return response.data;
    },
    getUsers: async () => {
        const response = await api.get('/employees/users');
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
    // deleteCertType: async (certID: string) => {
    //     const response = await api.delete(`/certs/${certID}`);
    //     return response.data;
    // }
};

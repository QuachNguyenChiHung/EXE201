import { api } from './asus_api';

export interface StatisticResponseDTO {
  usersCount: number;
  usersByRole: Record<string, number>;
  warehousesByStatus: Record<string, number>;
  rentRequestsByStatus: Record<string, number>;
  contractsByStatus: Record<string, number>;
}

export interface CertReviewPayload {
  status: string;
  typeId?: number | null;
  rejectReason?: string;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  status: string;
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  status?: string;
  imgLink?: string;
  hashTaxCode?: string;
}

export interface GetAllTransactionsParams {
  type?: string;
  status?: string;
  buyerRole?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  granularity?: string;
  sort?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
}

export const employeeService = {
  // =============== AUTH/PASSWORD ===============
  changeOwnPassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await api.post('/employees/me/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },

  // =============== DASHBOARD STATISTICS ===============
  getStatistics: async (): Promise<StatisticResponseDTO> => {
    const { data } = await api.get('/employees/statistic');
    return data;
  },

  // =============== USERS ===============
  getUsers: async (
    page: number = 0,
    size: number = 10,
    role?: string,
    search?: string,
  ): Promise<PaginatedResponse<any>> => {
    const params: any = { page, size };
    if (role && role !== 'all') params.role = role;
    if (search && search.trim().length > 0) params.keyword = search.trim();
    const { data } = await api.get('/employees/users', { params });
    if (Array.isArray(data)) {
      return { content: data, totalPages: 1, totalElements: data.length };
    }
    return {
      content: data.content || [],
      totalPages: data.totalPages || 0,
      totalElements: data.totalElements || 0,
    };
  },

  getUserActivityStats: async (userId: number, days: number = 7): Promise<any> => {
    const { data } = await api.get(`/employees/users/${userId}/activity-stats`, { params: { days } });
    return data;
  },

  getActiveUsersByDate: async (startDate: string, endDate: string): Promise<any> => {
    const { data } = await api.get('/employees/statistics/active-users/by-date', {
      params: { startDate, endDate },
    });
    return data;
  },

  getActiveUsersByHour: async (date: string): Promise<any> => {
    const { data } = await api.get('/employees/statistics/active-users/by-hour', {
      params: { date },
    });
    return data;
  },

  getActiveUsersCount: async (days: number = 30): Promise<{ days: number; activeUsersCount: number; message: string }> => {
    const { data } = await api.get('/employees/users/active-count', { params: { days } });
    return data;
  },

  updateUser: async (userId: number, payload: UpdateUserPayload): Promise<any> => {
    const { data } = await api.put(`/employees/users/${userId}`, payload);
    return data;
  },

  updateUserStatus: async (userId: number, status: string): Promise<any> => {
    const { data } = await api.put(`/employees/users/${userId}/status`, null, { params: { status } });
    return data;
  },

  createUser: async (payload: CreateEmployeePayload): Promise<any> => {
    // Backend uses PATCH /api/users to create a user (admin-only).
    const { data } = await api.patch('/users', payload);
    return data;
  },

  // =============== RENTER & OWNER DETAILS ===============
  getRenterDetail: async (userId: number): Promise<any> => {
    const { data } = await api.get(`/employees/renters/${userId}/detail`);
    return data;
  },

  getOwnerDetail: async (userId: number): Promise<any> => {
    const { data } = await api.get(`/employees/owners/${userId}/detail`);
    return data;
  },

  // =============== WAREHOUSES ===============
  getAllWarehouses: async (
    page: number = 0,
    size: number = 10,
    status?: string,
  ): Promise<PaginatedResponse<any>> => {
    const params: any = { page, size };
    if (status) params.status = status;
    const { data } = await api.get('/employees/warehouses', { params });
    if (Array.isArray(data)) {
      return { content: data, totalPages: 1, totalElements: data.length };
    }
    return {
      content: data.content || [],
      totalPages: data.totalPages || 0,
      totalElements: data.totalElements || 0,
    };
  },

  getWarehouseDetail: async (id: number): Promise<any> => {
    const { data } = await api.get(`/employees/warehouses/${id}`);
    return data;
  },

  getWarehouseViewStats: async (id: number, days: number = 7): Promise<any> => {
    const { data } = await api.get(`/warehouses/${id}/view-stats`, { params: { days } });
    return data;
  },

  acceptWarehouse: async (id: number): Promise<any> => {
    const { data } = await api.patch(`/employees/warehouses/${id}/accept`);
    return data;
  },

  rejectWarehouse: async (id: number): Promise<any> => {
    const { data } = await api.patch(`/employees/warehouses/${id}/rejected`);
    return data;
  },

  reviewWarehouseCertification: async (
    submitId: number,
    payload: CertReviewPayload,
  ): Promise<any> => {
    const { data } = await api.patch(`/employees/certifications/${submitId}/review`, payload);
    return data;
  },

  // =============== CERT TYPES ===============
  getCertTypes: async (): Promise<any[]> => {
    const { data } = await api.get('/certs');
    return Array.isArray(data) ? data : [];
  },

  createCertType: async (payload: any): Promise<any> => {
    const { data } = await api.post('/certs', payload);
    return data;
  },

  updateCertType: async (certId: string | number, payload: any): Promise<any> => {
    const { data } = await api.put(`/certs/${certId}`, payload);
    return data;
  },

  deleteCertType: async (certId: string | number): Promise<any> => {
    const { data } = await api.delete(`/certs/${certId}`);
    return data;
  },

  // =============== CONTRACTS ===============
  getContracts: async (status?: string, page: number = 0, size: number = 10): Promise<any> => {
    const params: any = { page, size };
    if (status && status !== 'ALL') params.status = status;
    const { data } = await api.get('/contracts', { params });
    return data;
  },

  getContractDetail: async (id: number): Promise<any> => {
    const { data } = await api.get(`/contracts/${id}`);
    return data;
  },

  // =============== REQUESTS ===============
  getRequestDetail: async (id: number): Promise<any> => {
    const { data } = await api.get(`/requests/${id}`);
    return data;
  },

  // =============== TRANSACTIONS ===============
  getAllTransactions: async (params: GetAllTransactionsParams): Promise<PaginatedResponse<any>> => {
    const { data } = await api.get('/employees/transactions', { params });
    if (Array.isArray(data)) {
      return { content: data, totalPages: 1, totalElements: data.length };
    }
    return {
      content: data.content || [],
      totalPages: data.totalPages || 0,
      totalElements: data.totalElements || 0,
    };
  },

  getTransactionAnalyticsSummary: async (): Promise<any> => {
    const { data } = await api.get('/employees/transactions/analytics-summary');
    return data;
  },

  getTransactionRevenueTimeseries: async (
    granularity: string,
    startDate: string,
    endDate: string,
  ): Promise<any[]> => {
    const { data } = await api.get('/employees/transactions/revenue-timeseries', {
      params: { granularity, startDate, endDate },
    });
    return Array.isArray(data) ? data : [];
  },

  deleteTransaction: async (id: number): Promise<string> => {
    const { data } = await api.delete(`/employees/transactions/${id}`);
    return data;
  },

  // =============== AI TIERS ===============
  getAllAiTiers: async (): Promise<any[]> => {
    const { data } = await api.get('/employees/ai-tiers');
    return Array.isArray(data) ? data : [];
  },

  createAiTier: async (payload: any): Promise<any> => {
    const { data } = await api.post('/employees/ai-tiers', payload);
    return data;
  },

  updateAiTier: async (id: number, payload: any): Promise<any> => {
    const { data } = await api.put(`/employees/ai-tiers/${id}`, payload);
    return data;
  },

  deleteAiTier: async (id: number): Promise<any> => {
    const { data } = await api.delete(`/employees/ai-tiers/${id}`);
    return data;
  },

  // =============== SPONSOR TIERS ===============
  getAllSponsorTiers: async (): Promise<any[]> => {
    const { data } = await api.get('/employees/sponsor-tiers');
    return Array.isArray(data) ? data : [];
  },

  createSponsorTier: async (payload: any): Promise<any> => {
    const { data } = await api.post('/employees/sponsor-tiers', payload);
    return data;
  },

  updateSponsorTier: async (id: number, payload: any): Promise<any> => {
    const { data } = await api.put(`/employees/sponsor-tiers/${id}`, payload);
    return data;
  },

  deleteSponsorTier: async (id: number): Promise<any> => {
    const { data } = await api.delete(`/employees/sponsor-tiers/${id}`);
    return data;
  },
};

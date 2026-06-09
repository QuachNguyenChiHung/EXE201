import { api } from './asus_api';

export interface RegisterRequestDTO {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: string;
  companyName?: string;
  companyTaxCode?: string;
}

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  register: async (data: RegisterRequestDTO): Promise<string> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  }
};

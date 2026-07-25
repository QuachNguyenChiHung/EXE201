import { api } from './asus_api';
import { TransactionResponseDTO } from '../types/api';

export const paymentService = {
  getTransactionHistory: async (): Promise<TransactionResponseDTO[]> => {
    const res = await api.get('/payment/history');
    return res.data;
  },
};

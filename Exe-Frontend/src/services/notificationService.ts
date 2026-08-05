import { api } from './asus_api';
import type { Notification } from '../types';

export const notificationService = {
  getNotifications: async (page = 0, size = 20): Promise<{ content: Notification[]; totalPages: number; totalElements: number }> => {
    const res = await api.get('/notifications', { params: { page, size } });
    return {
      content: res.data.content || [],
      totalPages: res.data.totalPages || 0,
      totalElements: res.data.totalElements || 0,
    };
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },

  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/mark-read');
  },
};

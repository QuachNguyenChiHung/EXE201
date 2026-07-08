import { api } from './asus_api';
import type { Notification } from '../types';

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications');
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },

  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/mark-read');
  },
};

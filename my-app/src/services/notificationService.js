import axios from 'axios';
import { envConfig } from '../config/environment';

const apiClient = axios.create({
  baseURL: envConfig.apiUrl,
  headers: { 'Content-Type': 'application/json' }
});

// Adapter: snake_case backend to camelCase frontend
const adaptNotification = (n) => ({
  id: n.id,
  type: n.type,
  actorName: n.actor_name || n.actorName,
  actorAvatar: n.actor_avatar || n.actorAvatar,
  targetTitle: n.target_title || n.targetTitle,
  message: n.message,
  read: n.read,
  createdAt: n.created_at || n.createdAt
});

export const fetchNotifications = async () => {
  const { data } = await apiClient.get('/notifications');
  return Array.isArray(data) ? data.map(adaptNotification) : [];
};

export const markNotificationRead = async (notifId) => {
  const { data } = await apiClient.put(`/notifications/${notifId}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await apiClient.put('/notifications/read-all');
  return data;
};

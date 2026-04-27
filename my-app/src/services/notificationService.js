import axios from "axios";
import { clearAuthToken, readAuthToken } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});
apiClient.interceptors.request.use((config) => {
  const token = readAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const isUnauthorized = (error) => error?.response?.status === 401;

const handleUnauthorized = (error) => {
  if (!isUnauthorized(error)) return false;

  clearAuthToken();
  return true;
};

// Adapter: snake_case backend to camelCase frontend
const adaptNotification = (n) => ({
  id: n.id,
  type: n.type,
  actorName: n.actor_name || n.actorName,
  actorAvatar: n.actor_avatar || n.actorAvatar,
  targetTitle: n.target_title || n.targetTitle,
  message: n.message,
  read: n.read,
  createdAt: n.created_at || n.createdAt,
});

export const fetchNotifications = async () => {
  if (!readAuthToken()) return [];

  try {
    const { data } = await apiClient.get("/notifications");
    return Array.isArray(data) ? data.map(adaptNotification) : [];
  } catch (error) {
    if (handleUnauthorized(error)) return [];
    throw error;
  }
};

export const markNotificationRead = async (notifId) => {
  if (!readAuthToken()) return null;

  try {
    const { data } = await apiClient.put(`/notifications/${notifId}/read`);
    return data;
  } catch (error) {
    if (handleUnauthorized(error)) return null;
    throw error;
  }
};

export const markAllNotificationsRead = async () => {
  if (!readAuthToken()) return null;

  try {
    const { data } = await apiClient.put("/notifications/read-all");
    return data;
  } catch (error) {
    if (handleUnauthorized(error)) return null;
    throw error;
  }
};

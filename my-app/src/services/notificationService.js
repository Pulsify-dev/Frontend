import axios from "axios";
import { clearAuthToken, readAuthToken } from "./api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

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
export const adaptNotification = (n) => ({
  id: n._id || n.id,
  type: n.action_type || n.type,
  actorId: n.actor_id?._id || n.actor_id || n.actorId,
  actorName:
    n.actor_id?.display_name || n.actor_name || n.actorName || "Someone",
  actorAvatar: n.actor_id?.avatar_url || n.actor_avatar || n.actorAvatar || "",
  targetTitle: n.target_title || n.targetTitle,
  message: n.message || `performed a ${n.action_type || "action"}`,
  read: n.is_read || n.read,
  createdAt: n.created_at || n.createdAt,
  entityId: n.entity_id,
  entityType: n.entity_type,
});

export const fetchNotifications = async () => {
  const { data } = await apiClient.get("/notifications?page=1&limit=20");
  const items = data.data || data; // Handle 'data: []' envelope from spec
  return Array.isArray(items) ? items.map(adaptNotification) : [];
};

export const fetchUnreadCount = async () => {
  const { data } = await apiClient.get("/notifications/unread-count");
  return data.data?.unread_count || 0;
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

export const registerPushToken = async (token) => {
  const { data } = await apiClient.post("/notifications/push-token", { token });
  return data;
};

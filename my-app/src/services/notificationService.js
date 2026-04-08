import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});
apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("pulsify_access_token") ||
    localStorage.getItem("pulsify_jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
  createdAt: n.created_at || n.createdAt,
});

export const fetchNotifications = async () => {
  const { data } = await apiClient.get("/notifications");
  return Array.isArray(data) ? data.map(adaptNotification) : [];
};

export const markNotificationRead = async (notifId) => {
  const { data } = await apiClient.put(`/notifications/${notifId}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await apiClient.put("/notifications/read-all");
  return data;
};

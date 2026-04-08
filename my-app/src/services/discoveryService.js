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

// Adapter to convert backend snake_case to frontend camelCase
const adaptTrack = (track) => ({
  trackId: track.track_id || track.trackId,
  title: track.title,
  artist: {
    id: track.artist?.id,
    name: track.artist?.name,
    avatarUrl: track.artist?.avatar_url || track.artist?.avatarUrl,
  },
  plays: track.plays,
  likes: track.likes,
  reposts: track.reposts,
  coverArt: track.cover_art || track.coverArt,
  durationSeconds: track.duration_seconds || track.durationSeconds,
  uploadedAt: track.uploaded_at || track.uploadedAt,
});

export const fetchFeed = async () => {
  const { data } = await apiClient.get("/discovery/feed");
  return Array.isArray(data) ? data.map(adaptTrack) : [];
};

export const fetchTrending = async () => {
  const { data } = await apiClient.get("/discovery/trending");
  return Array.isArray(data) ? data.map(adaptTrack) : [];
};

export const searchTracks = async (term) => {
  const safeTerm = encodeURIComponent(term);
  const { data } = await apiClient.get(`/discovery/search?q=${safeTerm}`);
  return Array.isArray(data) ? data.map(adaptTrack) : [];
};

export const likeTrack = async (trackId) => {
  const { data } = await apiClient.post(`/tracks/${trackId}/like`);
  return data;
};

export const repostTrack = async (trackId) => {
  const { data } = await apiClient.post(`/tracks/${trackId}/repost`);
  return data;
};

export const recordPlay = async (trackId) => {
  const { data } = await apiClient.post(`/tracks/${trackId}/play`);
  return data;
};

// Resource Resolver: resolve a permalink URL into a resource object
export const resolveUrl = async (permalink) => {
  const safeUrl = encodeURIComponent(permalink);
  const { data } = await apiClient.get(`/resolve?url=${safeUrl}`);
  return data;
};

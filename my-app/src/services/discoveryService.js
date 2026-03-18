import axios from 'axios';
import { envConfig } from '../config/environment';

const apiClient = axios.create({
  baseURL: envConfig.apiUrl,
  headers: { 'Content-Type': 'application/json' }
});

// Adapter to convert backend snake_case to frontend camelCase
const adaptTrack = (track) => ({
  trackId: track.track_id || track.trackId,
  title: track.title,
  artist: {
    id: track.artist?.id,
    name: track.artist?.name,
    avatarUrl: track.artist?.avatar_url || track.artist?.avatarUrl
  },
  plays: track.plays,
  likes: track.likes,
  reposts: track.reposts,
  coverArt: track.cover_art || track.coverArt,
  durationSeconds: track.duration_seconds || track.durationSeconds,
  uploadedAt: track.uploaded_at || track.uploadedAt
});

export const fetchFeed = async () => {
  const { data } = await apiClient.get('/discovery/feed');
  return Array.isArray(data) ? data.map(adaptTrack) : [];
};

export const fetchTrending = async () => {
  const { data } = await apiClient.get('/discovery/trending');
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

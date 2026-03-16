import axios from 'axios';
import { envConfig } from '../config/environment';

const apiClient = axios.create({
  baseURL: envConfig.apiUrl,
  headers: { 'Content-Type': 'application/json' }
});

export const fetchFeed = async () => {
  const { data } = await apiClient.get('/discovery/feed');
  return data;
};

export const fetchTrending = async () => {
  const { data } = await apiClient.get('/discovery/trending');
  return data;
};

export const searchTracks = async (term) => {
  // encode to protect the backend route
  const safeTerm = encodeURIComponent(term);
  const { data } = await apiClient.get(`/discovery/search?q=${safeTerm}`);
  return data;
};

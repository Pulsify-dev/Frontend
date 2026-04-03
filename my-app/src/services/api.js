import axios from 'axios';
import mockData from '../mock/track.json';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://www.pulsify.page/api';
const useMock = String(import.meta.env.VITE_USE_MOCKS) === 'true';

export const pulsifyAxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

pulsifyAxiosInstance.interceptors.request.use((config) => {
  const securityToken = localStorage.getItem('pulsify_jwt_token');
  if (securityToken) {
    config.headers.Authorization = `Bearer ${securityToken}`;
  }
  return config;
});

export const getTrack = async () => {
  if (useMock) {
    return mockData.track;
  }
  const response = await fetch(`${API_BASE}/tracks/active`);
  if (!response.ok) {
    throw new Error('Failed to load track');
  }
  return response.json();
};

export const envConfig = {
  // Flip to false when backend is ready
  useMockApi: import.meta.env.VITE_USE_MOCK_API !== 'false',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
};

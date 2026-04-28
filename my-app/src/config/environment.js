const rawMockFlag =
  import.meta.env.VITE_USE_MOCK_API ??
  import.meta.env.VITE_USE_MOCKS ??
  import.meta.env.VITE_USE_MOCK ??
  "true";

export const envConfig = {
  // Flip to false when backend is ready
  useMockApi: String(rawMockFlag).toLowerCase() !== "false",
  apiUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
};

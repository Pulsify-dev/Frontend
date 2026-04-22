import { envConfig } from '../config/environment';

const API_BASE_URL = envConfig.apiUrl;

export const createReport = async (reportData) => {
  const token = localStorage.getItem('pulsify_access_token') || localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(reportData)
  });
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || errorJson.error || errorText);
    } catch (e) {
      throw new Error(errorText);
    }
  }
  return response.json();
};

export const getReports = async ({ page = 1, limit = 20, status = 'Pending' } = {}) => {
  const token = localStorage.getItem('pulsify_access_token') || localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
  const response = await fetch(
    `${API_BASE_URL}/admin/reports?page=${page}&limit=${limit}&status=${status}`, 
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    console.error("Fetch Reports Error:", response.status, errText);
    throw new Error(errText);
  }
  return response.json();
};

export const resolveReport = async (reportId, status, adminNotes) => {
  const token = localStorage.getItem('pulsify_access_token') || localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE_URL}/admin/reports/${reportId}/resolve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status, admin_notes: adminNotes })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const suspendUser = async (userId) => {
  const token = localStorage.getItem('pulsify_access_token') || localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/suspend`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const restoreUser = async (userId) => {
  const token = localStorage.getItem('pulsify_access_token') || localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/restore`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const getUsers = async ({ page = 1, limit = 20, role = 'All', search = '' } = {}) => {
  const token = localStorage.getItem('pulsify_access_token') || localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
  const query = new URLSearchParams({ page, limit });
  if (role !== 'All') query.append('role', role);
  if (search) query.append('search', search);
  
  const response = await fetch(`${API_BASE_URL}/admin/users?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const updateUserRole = async (userId, role) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ role })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const getSystemLogs = async ({ level = 'All' } = {}) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
  const query = new URLSearchParams();
  if (level !== 'All') query.append('level', level);
  
  const response = await fetch(`${API_BASE_URL}/admin/logs?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

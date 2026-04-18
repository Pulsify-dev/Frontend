import { envConfig } from '../config/environment';

const API_BASE_URL = envConfig.apiBaseUrl;

export const createReport = async (reportData) => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(reportData)
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const getReports = async ({ page = 1, limit = 20, status = 'Pending' } = {}) => {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(
    `${API_BASE_URL}/admin/reports?page=${page}&limit=${limit}&status=${status}`, 
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const resolveReport = async (reportId, status, adminNotes) => {
  const token = localStorage.getItem('adminToken');
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/suspend`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const restoreUser = async (userId) => {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/restore`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

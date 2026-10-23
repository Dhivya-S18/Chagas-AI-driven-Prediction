import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chagasToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const signupUser = async (profile) => {
  const response = await api.post('/auth/signup', profile);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateCurrentUser = async (profile) => {
  const response = await api.put('/auth/me', profile);
  return response.data;
};

export const getBackendHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getECGRecords = async () => {
  const response = await api.get('/ecg');
  return response.data;
};

export const getAnalyses = async () => {
  const response = await api.get('/analysis');
  return response.data;
};

export const createAnalysis = async (recordingId) => {
  const response = await api.post('/analysis', { recordingId });
  return response.data;
};

export const getAlerts = async () => {
  const response = await api.get('/alerts');
  return response.data;
};

export const getReports = async () => {
  const response = await api.get('/reports');
  return response.data;
};

export const createReport = async (payload) => {
  const response = await api.post('/reports', payload);
  return response.data;
};

export const downloadReport = async (reportId) => {
  const response = await api.get(`/reports/${encodeURIComponent(reportId)}/download`, {
    responseType: 'blob',
  });
  return response.data;
};
export const getECGMonitoringStatus = async () => {
  const response = await api.get('/ecg/monitor/status');
  return response.data;
};

export const getApiErrorMessage = (error, fallback = 'The request could not be completed.') =>
  error?.response?.data?.message || error?.message || fallback;

export default api;

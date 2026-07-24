import api from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const fetchUsers = async (params) => {
  const res = await api.get(API_ENDPOINTS.ADMIN.USERS, { params });
  return res.data;
};

export const updateUserStatus = async (userId, status) => {
  const res = await api.patch(API_ENDPOINTS.ADMIN.UPDATE_STATUS(userId), { status });
  return res.data;
};

export const deleteUser = async (userId) => {
  const res = await api.delete(API_ENDPOINTS.ADMIN.DELETE_USER(userId));
  return res.data;
};

export const fetchAuditLogs = async (params) => {
  const res = await api.get(API_ENDPOINTS.ADMIN.AUDIT_LOGS, { params });
  return res.data;
};

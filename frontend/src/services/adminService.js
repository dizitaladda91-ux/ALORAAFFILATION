import api from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
export const fetchAdminWithdrawals = async (params = {}) => (await api.get('/admin/withdrawals', { params })).data.data;
export const approveWithdrawal = async (id, notes = '') => (await api.patch(`/admin/withdrawals/${id}/approve`, { notes })).data.data;
export const rejectWithdrawal = async (id, notes = '') => (await api.patch(`/admin/withdrawals/${id}/reject`, { notes })).data.data;
export const fetchPayouts = async (params = {}) => (await api.get('/payouts', { params })).data.data;
export const createPayout = async (data) => (await api.post('/payouts', data)).data.data;
export const updatePayout = async (id, action, data = {}) => (await api.patch(`/payouts/${id}/${action}`, data)).data.data;

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

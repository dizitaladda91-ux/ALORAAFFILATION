import api from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { setAccessToken, setRefreshToken, clearTokens } from '../utils/storage';

export const loginUser = async (email, password) => {
  const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
  if (res.data.success) {
    const { user, tokens } = res.data.data;
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    return user;
  }
  throw new Error(res.data.message);
};

export const registerUser = async (formData) => {
  const res = await api.post(API_ENDPOINTS.AUTH.REGISTER, formData);
  if (res.data.success) {
    const { user, tokens } = res.data.data;
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    return user;
  }
  throw new Error(res.data.message);
};

export const getCurrentUser = async () => {
  const res = await api.get(API_ENDPOINTS.AUTH.ME);
  return res.data.data.user;
};

export const logoutUser = async () => {
  try {
    await api.post(API_ENDPOINTS.AUTH.LOGOUT);
  } finally {
    clearTokens();
  }
};

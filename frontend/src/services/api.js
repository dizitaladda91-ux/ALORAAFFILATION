import axios from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from '../utils/storage';

// Vite exposes environment variables at build time.  Keep local development
// self-contained, but use the deployed API when a production build is created
// without VITE_API_BASE_URL (for example, before the Vercel variable is added).
// An explicit VITE_API_BASE_URL always takes precedence.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.PROD
    ? 'https://affilation-software.onrender.com'
    : 'http://localhost:5000');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto Token Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
          if (res.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            setAccessToken(accessToken);
            setRefreshToken(newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          clearTokens();
        }
      } else {
        clearTokens();
      }
    }

    return Promise.reject(error.response ? error.response.data : error);
  }
);

export default api;

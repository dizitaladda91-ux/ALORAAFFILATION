export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  ADMIN: {
    USERS: '/admin/users',
    UPDATE_STATUS: (id) => `/admin/users/${id}/status`,
    DELETE_USER: (id) => `/admin/users/${id}`,
    AUDIT_LOGS: '/admin/audit-logs',
  },
  AFFILIATES: {
    LINKS: '/affiliates/links',
    EARNINGS: '/affiliates/earnings',
  },
  REFERRALS: {
    CLICK: (code) => `/referrals/click/${code}`,
    CONVERSION: '/referrals/conversion',
    TEAM: '/referrals/team',
  },
  COMMISSIONS: {
    RULES: '/commissions/rules',
    UPDATE_STATUS: (id) => `/commissions/${id}/status`,
  },
  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
  },
  PROFILE: {
    GET_UPDATE: '/profile',
  },
  SETTINGS: {
    GET_UPDATE: '/settings',
  },
};

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  dbUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/affiliate_db',
  dbMax: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  dbIdleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default_access_secret_for_dev_only',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_for_dev_only',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};

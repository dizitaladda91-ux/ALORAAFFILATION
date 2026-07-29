const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  apiPrefix: process.env.API_PREFIX || '',
  // Public affiliate portal.  This is deliberately a production URL so links
  // generated without an environment file never expose localhost to visitors.
  frontendUrl: process.env.FRONTEND_URL || 'https://affiliation.aloraradiance.com',
  storefrontUrl: process.env.STOREFRONT_URL || 'https://aloraradiance.com/',
  // Customers who arrive through a valid affiliate link receive this discount
  // on the storefront. Keep it configurable so promotions can be changed
  // without changing application code.
  affiliateDiscountPercent: parseFloat(process.env.AFFILIATE_DISCOUNT_PERCENT || '10'),
  dbUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/affiliate_db',
  dbMax: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  dbIdleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default_access_secret_for_dev_only',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_for_dev_only',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  // CORS_ORIGIN may contain a comma-separated list, e.g. the production
  // Vercel domain plus a preview domain. Falling back to FRONTEND_URL keeps
  // the two production settings consistent when only FRONTEND_URL is set.
  // Render environment variables are optional in the Blueprint.  Use the
  // deployed frontend as the production default so an omitted variable does
  // not make every browser API request fail its CORS preflight.
  corsOrigins: [
    ...(process.env.CORS_ORIGIN
      || process.env.FRONTEND_URL
      || (process.env.NODE_ENV === 'production'
        ? 'https://affiliation.aloraradiance.com'
        : 'http://localhost:3000'))
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    // Keep the custom production domain available during a DNS migration even
    // if Render still has an older CORS_ORIGIN value configured.
    ...(process.env.NODE_ENV === 'production'
      ? ['https://affiliation.aloraradiance.com']
      : []),
  ],
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  // Render terminates TLS and forwards the original client IP through one
  // trusted proxy. Keep proxy trust disabled for local development.
  trustProxy: process.env.TRUST_PROXY
    ? parseInt(process.env.TRUST_PROXY, 10)
    : (process.env.NODE_ENV === 'production' ? 1 : false),
};

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

module.exports = {
  // CORS_ORIGIN may contain a comma-separated list, e.g. the production
  // Vercel domain plus a preview domain. Falling back to FRONTEND_URL keeps
  // the two production settings consistent when only FRONTEND_URL is set.
  // Render environment variables are optional in the Blueprint.  Use the
  // deployed frontend as the production default so an omitted variable does
  // not make every browser API request fail its CORS preflight.
  corsOrigins: (process.env.CORS_ORIGIN
    || process.env.FRONTEND_URL
    || (process.env.NODE_ENV === 'production'
      ? 'https://affilationsoftware.vercel.app'
      : 'http://localhost:3000'))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  // Render terminates TLS and forwards the original client IP through one
  // trusted proxy. Keep proxy trust disabled for local development.
  trustProxy: process.env.TRUST_PROXY
    ? parseInt(process.env.TRUST_PROXY, 10)
    : (process.env.NODE_ENV === 'production' ? 1 : false),
};

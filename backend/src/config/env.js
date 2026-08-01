const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const env = process.env.NODE_ENV || 'development';
const requireProductionSecret = (name, minimumLength = 1) => {
  const value = process.env[name];
  if (env === 'production' && (!value || value.length < minimumLength)) {
    throw new Error(`${name} must be configured securely when NODE_ENV=production`);
  }
  return value;
};

const accessSecret = requireProductionSecret('JWT_ACCESS_SECRET', 32) || 'default_access_secret_for_dev_only';
const refreshSecret = requireProductionSecret('JWT_REFRESH_SECRET', 32) || 'default_refresh_secret_for_dev_only';
const storefrontApiKey = requireProductionSecret('STOREFRONT_API_KEY', 32) || '';
const paymentsEnabled = process.env.PAYMENTS_ENABLED === 'true';
const payoutMakerCheckerMinimum = Number(process.env.PAYOUT_MAKER_CHECKER_MIN_AMOUNT || '0');
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
if (env === 'production' && paymentsEnabled) {
  if (!razorpayKeyId || !razorpayKeySecret || !razorpayWebhookSecret) {
    throw new Error('Razorpay credentials must be configured when PAYMENTS_ENABLED=true');
  }
}
const emailEnabled = process.env.EMAIL_ENABLED === 'true';
const emailProvider = process.env.EMAIL_PROVIDER || 'test';
if (env === 'production' && emailEnabled) {
  if (!['smtp', 'sendgrid', 'gmail'].includes(emailProvider)) {
    throw new Error('EMAIL_PROVIDER must be smtp, sendgrid, or gmail when EMAIL_ENABLED=true');
  }
  const providerCredentials = {
    smtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
    sendgrid: Boolean(process.env.SENDGRID_API_KEY),
    gmail: Boolean(process.env.GMAIL_USER && process.env.GMAIL_PASSWORD),
  };
  if (!providerCredentials[emailProvider]) {
    throw new Error(`Email credentials for provider '${emailProvider}' must be configured when EMAIL_ENABLED=true`);
  }
}

module.exports = {
  env,
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
  razorpay: {
    keyId: razorpayKeyId,
    keySecret: razorpayKeySecret,
    webhookSecret: razorpayWebhookSecret,
  },
  paymentsEnabled,
  payoutMakerCheckerMinimum: Number.isFinite(payoutMakerCheckerMinimum) ? payoutMakerCheckerMinimum : 0,
  dbUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/affiliate_db',
  dbMax: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  dbIdleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  dbSslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED
    ? process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
    : env === 'production',
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  storefrontApiKey,
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
  // Email configuration
  email: {
    // Do not attempt delivery through placeholder test SMTP credentials in
    // production. Enable only after a real provider is configured.
    enabled: process.env.EMAIL_ENABLED
      ? emailEnabled
      : env !== 'production',
    provider: emailProvider, // 'smtp', 'sendgrid', 'gmail', 'test'
    fromEmail: process.env.EMAIL_FROM || 'noreply@affiliatemanagement.com',
    // SMTP Configuration
    smtpHost: process.env.SMTP_HOST || 'smtp.example.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpSecure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    // SendGrid Configuration
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    // Gmail Configuration
    gmailUser: process.env.GMAIL_USER || '',
    gmailPassword: process.env.GMAIL_PASSWORD || '', // Use app-specific password for Gmail
    // Test Configuration (Ethereal)
    testUser: process.env.EMAIL_TEST_USER || 'test@ethereal.email',
    testPassword: process.env.EMAIL_TEST_PASSWORD || 'test-password',
  },
};

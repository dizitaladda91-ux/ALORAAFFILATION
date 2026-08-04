const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const { globalRateLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorMiddleware');
const routesV1 = require('./routes/v1');
const ApiError = require('./utils/apiError');
const { writeHealthSnapshot } = require('./monitoring/healthcheck');
const fs = require('fs');
const path = require('path');

const app = express();

// Render sits in front of this service and supplies X-Forwarded-For. Trusting
// one proxy lets express-rate-limit identify the original client correctly.
app.set('trust proxy', config.trustProxy);

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS policy'));
    },
    credentials: true,
  })
);

// Body parser & Cookie parser
const razorpayWebhookPath = `${config.apiPrefix || ''}/payments/webhook` || '/payments/webhook';
app.use(razorpayWebhookPath, express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiter
app.use(globalRateLimiter);

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Root endpoint
app.get('/', (req, res, next) => {
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDistPath)) {
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  }
  res.status(200).json({
    success: true,
    application: 'Affiliate Management API',
    version: '1.0.0',
    environment: config.env,
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  return require('./database').query('SELECT 1')
    .then(() => {
      const payload = {
        status: 'UP',
        database: 'UP',
        environment: config.env,
        timestamp: new Date().toISOString(),
        uptime: process.uptime().toFixed(2),
      };
      writeHealthSnapshot('UP', payload);
      return res.status(200).json(payload);
    })
    .catch((error) => {
      const payload = {
        status: 'DOWN',
        database: 'DOWN',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
      writeHealthSnapshot('DOWN', payload);
      return res.status(503).json(payload);
    });
});

app.get('/docs', (req, res) => {
  const docsPath = path.join(__dirname, 'docs', 'openapi.json');
  if (fs.existsSync(docsPath)) {
    return res.sendFile(docsPath);
  }
  return res.status(404).json({ message: 'OpenAPI document not found' });
});

// API Routes — e.g. /api/v1/auth/login or /auth/login
if (config.apiPrefix) {
  app.use(config.apiPrefix, routesV1);
} else {
  app.use(routesV1);
}

// Serve static frontend build assets and handle SPA client-side routing fallback
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/health') || req.originalUrl.startsWith('/docs') || (config.apiPrefix && req.originalUrl.startsWith(config.apiPrefix))) {
      return next(ApiError.notFound(`Cannot find route ${req.originalUrl} on this server`));
    }
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Handle 404 for unhandled API requests
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot find route ${req.originalUrl} on this server`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;

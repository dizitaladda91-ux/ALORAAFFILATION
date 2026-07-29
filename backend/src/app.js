const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const { globalRateLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorMiddleware');
const routesV1 = require('./routes/v1');
const ApiError = require('./utils/apiError');

const app = express();

// Render sits in front of this service and supplies X-Forwarded-For. Trusting
// one proxy lets express-rate-limit identify the original client correctly.
app.set('trust proxy', config.trustProxy);

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    // Reflect every requesting origin. `credentials: true` cannot be combined
    // with Access-Control-Allow-Origin: *, so cors handles the reflection.
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);


// Body parser & Cookie parser
// Razorpay's signature is calculated on the exact raw bytes. This must be
// registered before the JSON parser and must remain unauthenticated.
app.use('/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiter
app.use(globalRateLimiter);

// Browsers may request this automatically when the API URL is opened directly.
// There is no API favicon, so return an empty successful response without
// sending the request through the 404 error handler.
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    application: 'Affiliate Management API',
    version: '1.0.0',
    environment: config.env,
    api: config.apiPrefix || '/',
    health: '/health',
    documentation: config.apiPrefix || '/',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// API Routes — no version prefix, e.g. POST /auth/login.
if (config.apiPrefix) {
  app.use(config.apiPrefix, routesV1);
} else {
  app.use(routesV1);
}

// Handle 404
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot find route ${req.originalUrl} on this server`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;

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

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parser & Cookie parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiter
app.use(globalRateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use(config.apiPrefix, routesV1);

// Handle 404
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot find route ${req.originalUrl} on this server`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;

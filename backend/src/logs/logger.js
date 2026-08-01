const fs = require('fs');
const path = require('path');
const winston = require('winston');
const config = require('../config/env');

const logDirectory = path.join(__dirname, '..', '..', 'logs');
fs.mkdirSync(logDirectory, { recursive: true });

const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'affiliate-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
        )
      ),
    }),
    new winston.transports.File({ filename: path.join(logDirectory, 'api.log'), maxsize: 5 * 1024 * 1024, maxFiles: 5 }),
  ],
});

if (process.env.ERROR_TRACKING_URL) {
  logger.on('error', async (err) => {
    try {
      await fetch(process.env.ERROR_TRACKING_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: err.message, stack: err.stack, timestamp: new Date().toISOString() }),
      });
    } catch (_) {
      // Ignore tracking failures so application health is not impacted.
    }
  });
}

module.exports = logger;

const commissionService = require('./commissionService');
const logger = require('../logs/logger');

let intervalId = null;

/**
 * Automatically run background commission settlement check every intervalMinutes.
 * Settles any pending commission created past holdHours (default: 24 hours).
 */
const startScheduler = (intervalMinutes = 15, holdHours = 24) => {
  logger.info(`Starting background 24-hour commission auto-settlement scheduler (interval: every ${intervalMinutes} min)...`);
  
  // Run once immediately on startup
  commissionService.autoSettleMaturedCommissions(holdHours).catch((err) => {
    logger.error('Startup auto-settlement check notice:', err.message);
  });

  // Schedule recurring interval
  intervalId = setInterval(async () => {
    try {
      await commissionService.autoSettleMaturedCommissions(holdHours);
    } catch (err) {
      logger.error('Scheduled auto-settlement error:', err.message);
    }
  }, intervalMinutes * 60 * 1000);
};

const stopScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

module.exports = { startScheduler, stopScheduler };

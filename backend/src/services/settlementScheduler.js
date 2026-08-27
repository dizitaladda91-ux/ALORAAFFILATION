const commissionService = require('./commissionService');
const logger = require('../logs/logger');

let intervalId = null;

/**
 * Automatically run background commission settlement check every intervalMinutes.
 * Settles any pending commission created past holdDays (default: 7 days).
 */
const startScheduler = (intervalMinutes = 15, holdDays = 7) => {
  logger.info(`Starting background 7-day commission auto-settlement scheduler (interval: every ${intervalMinutes} min, hold: ${holdDays} days)...`);
  
  // Run once immediately on startup
  commissionService.autoSettleMaturedCommissions(holdDays).catch((err) => {
    logger.error('Startup auto-settlement check notice:', err.message);
  });

  // Schedule recurring interval
  intervalId = setInterval(async () => {
    try {
      await commissionService.autoSettleMaturedCommissions(holdDays);
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

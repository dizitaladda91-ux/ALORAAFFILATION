const fs = require('fs');
const path = require('path');
const db = require('./index');
const logger = require('../logs/logger');

const runFullInit = async () => {
  try {
    logger.info('Starting Full Master Database Setup...');
    const masterSql = fs.readFileSync(path.join(__dirname, 'init_full_database.sql'), 'utf8');
    await db.query(masterSql);
    logger.info('Full Database Schema & Seed Data populated successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
};

runFullInit();

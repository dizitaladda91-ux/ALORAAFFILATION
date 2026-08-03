const fs = require('fs');
const path = require('path');
const db = require('./index');
const logger = require('../logs/logger');

const runTestDataSeed = async () => {
  try {
    logger.info('Starting Test Data Seeding...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed_random_test_data.sql'), 'utf8');
    await db.query(seedSql);
    logger.info('Test Data Seeding completed successfully! Realistic analytics, clicks, conversions, bank accounts, wallets & payouts inserted.');
    process.exit(0);
  } catch (error) {
    logger.error('Test Data Seeding failed:', error);
    process.exit(1);
  }
};

runTestDataSeed();

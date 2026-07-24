const { body } = require('express-validator');

const createRuleValidator = [
  body('name').notEmpty().withMessage('Rule name is required').trim(),
  body('type').isIn(['percentage', 'flat']).withMessage('Type must be percentage or flat'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
];

const conversionValidator = [
  body('referralCode').notEmpty().withMessage('Referral code is required'),
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
];

module.exports = {
  createRuleValidator,
  conversionValidator,
};

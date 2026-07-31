const { body } = require('express-validator');

const createRuleValidator = [
  body('name').notEmpty().withMessage('Rule name is required').trim(),
  body('type').isIn(['percentage', 'flat']).withMessage('Type must be percentage or flat'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
];

const conversionValidator = [
  body('referralCode').notEmpty().trim().isLength({ max: 50 }).withMessage('Referral code is required'),
  body('orderId').notEmpty().trim().isLength({ max: 100 }).withMessage('A valid order ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').optional().isLength({ min: 3, max: 3 }).toUpperCase(),
  body('clickId').optional().isUUID().withMessage('A valid click ID is required'),
];

module.exports = {
  createRuleValidator,
  conversionValidator,
};

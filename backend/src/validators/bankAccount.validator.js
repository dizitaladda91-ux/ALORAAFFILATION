const { body } = require('express-validator');

const accountFields = [
  body('accountHolderName').trim().isLength({ min: 3, max: 100 }).withMessage('Account holder name must be 3 to 100 characters.'),
  body('bankName').trim().isLength({ min: 2, max: 100 }).withMessage('Bank name must be 2 to 100 characters.'),
  body('accountNumber').trim().matches(/^[0-9]{9,18}$/).withMessage('Account number must contain 9 to 18 digits.'),
  body('ifscCode')
    .trim()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/i)
    .withMessage('Invalid IFSC code. Format: 4 letters, 0, 6 characters (e.g. SBIN0001234).')
    .customSanitizer((val) => (typeof val === 'string' ? val.toUpperCase() : val)),
  body('branchName').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('Branch name must be at most 100 characters.'),
  body('upiId').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('UPI ID must be at most 100 characters.'),
  body('accountType').isIn(['SAVINGS', 'CURRENT']).withMessage('Account type must be SAVINGS or CURRENT.'),
];

module.exports = {
  createBankAccountSchema: [...accountFields, body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean.')],
  updateBankAccountSchema: accountFields,
};

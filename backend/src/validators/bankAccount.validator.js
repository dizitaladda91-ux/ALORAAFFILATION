const { body } = require('express-validator');

const accountFields = [
  body('accountHolderName').trim().isLength({ min: 3, max: 100 }).withMessage('Account holder name must be 3 to 100 characters.'),
  body('upiId')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .customSanitizer((val) => (typeof val === 'string' ? val.replace(/\s+/g, '') : val))
    .matches(/^(?:[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}|[6-9][0-9]{9})$/)
    .withMessage('Please enter a valid UPI ID (e.g. name@ybl, 9315507417@kotakbank) or 10-digit Mobile Number (e.g. 9876543210).'),
  body('bankName')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be 2 to 100 characters.'),
  body('accountNumber')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .customSanitizer((val) => (typeof val === 'string' ? val.replace(/\s+/g, '') : val))
    .matches(/^[0-9]{9,18}$/)
    .withMessage('Account number must contain 9 to 18 digits.'),
  body('ifscCode')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .customSanitizer((val) => {
      if (typeof val !== 'string') return val;
      let clean = val.replace(/\s+/g, '').toUpperCase();
      if (clean.length >= 5 && clean[4] === 'O') {
        clean = clean.substring(0, 4) + '0' + clean.substring(5);
      }
      return clean;
    })
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code. Format: 4 letters, 0, 6 characters (e.g. SBIN0001234).'),
  body('branchName').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Branch name must be at most 100 characters.'),
  body('accountType')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .customSanitizer((val) => (val ? val.toString().toUpperCase() : 'SAVINGS'))
    .isIn(['SAVINGS', 'CURRENT'])
    .withMessage('Account type must be SAVINGS or CURRENT.'),
  body().custom((data) => {
    if (!data.upiId && !data.accountNumber) {
      throw new Error('Please provide at least a UPI ID or Bank Account Number.');
    }
    return true;
  }),
];

module.exports = {
  createBankAccountSchema: [...accountFields, body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean.')],
  updateBankAccountSchema: accountFields,
};

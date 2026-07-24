const crypto = require('crypto');

/**
 * Generates a unique, high-entropy referral code (e.g. AFF-HJ72KS)
 */
const generateReferralCode = (prefix = 'AFF') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like O, 0, I, 1
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `${prefix}-${code}`;
};

module.exports = {
  generateReferralCode,
};

const referralService = require('../services/referralService');
const { sendSuccess } = require('../helpers/responseHelper');
const asyncHandler = require('../utils/asyncHandler');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class ReferralController {
  trackClick = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const result = await referralService.trackClick({
      referralCode: code,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      referrerUrl: req.get('referrer'),
    });
    return sendSuccess(res, 'Click tracked', result);
  });

  recordConversion = asyncHandler(async (req, res) => {
    const { referralCode, orderId, amount, currency, clickId } = req.body;
    const result = await referralService.processConversion({
      referralCode,
      orderId,
      amount: parseFloat(amount),
      currency,
      clickId,
    });
    return sendSuccess(res, 'Conversion & commission processed', result, HTTP_STATUS.CREATED);
  });

  getTeam = asyncHandler(async (req, res) => {
    const team = await referralService.getTeamMembers(req.user.id);
    return sendSuccess(res, 'Sub-affiliate team members retrieved', team);
  });
}

module.exports = new ReferralController();

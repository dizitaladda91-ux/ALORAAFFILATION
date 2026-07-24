const commissionService = require('../services/commissionService');
const { sendSuccess } = require('../helpers/responseHelper');
const asyncHandler = require('../utils/asyncHandler');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class CommissionController {
  getRules = asyncHandler(async (req, res) => {
    const rules = await commissionService.getRules();
    return sendSuccess(res, 'Commission rules fetched', rules);
  });

  createRule = asyncHandler(async (req, res) => {
    const { name, type, value } = req.body;
    const rule = await commissionService.createRule({
      name,
      type,
      value: parseFloat(value),
      createdBy: req.user.id,
    });
    return sendSuccess(res, 'Commission rule created', rule, HTTP_STATUS.CREATED);
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { commissionId } = req.params;
    const { status } = req.body;
    const updated = await commissionService.updateCommissionStatus(commissionId, status);
    return sendSuccess(res, `Commission status updated to ${status}`, updated);
  });
}

module.exports = new CommissionController();

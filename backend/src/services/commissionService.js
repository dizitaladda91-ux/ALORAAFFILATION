const commissionRepository = require('../repositories/commissionRepository');
const ApiError = require('../utils/apiError');

class CommissionService {
  async getRules() {
    return commissionRepository.findAllRules();
  }

  async createRule({ name, type, value, createdBy }) {
    return commissionRepository.createRule({ name, type, value, createdBy });
  }

  async updateCommissionStatus(commissionId, status) {
    const validStatuses = ['pending', 'approved', 'rejected', 'paid'];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await commissionRepository.updateCommissionStatus(commissionId, status);
    if (!updated) {
      throw ApiError.notFound('Commission record not found');
    }
    return updated;
  }
}

module.exports = new CommissionService();

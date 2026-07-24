const affiliateRepository = require('../repositories/affiliateRepository');
const commissionRepository = require('../repositories/commissionRepository');
const codeGenerator = require('../helpers/codeGenerator');
const config = require('../config/env');

class AffiliateService {
  async getUserLinks(userId) {
    return affiliateRepository.findLinksByUserId(userId);
  }

  async createCustomLink(userId, { targetUrl, title }) {
    const referralCode = codeGenerator.generateReferralCode('AFF');
    const finalTargetUrl = targetUrl || `${config.frontendUrl}/ref/${referralCode}`;
    return affiliateRepository.createLink({
      userId,
      referralCode,
      targetUrl: finalTargetUrl,
      title: title || 'Custom Campaign Link',
    });
  }

  async getAffiliateEarnings(userId) {
    const commissions = await commissionRepository.findCommissionsByAffiliate(userId);
    const clickCount = await affiliateRepository.getClickStats(userId);

    let totalEarnings = 0;
    let pendingEarnings = 0;
    let paidEarnings = 0;

    commissions.forEach((comm) => {
      const amt = parseFloat(comm.amount);
      if (comm.status === 'paid') {
        paidEarnings += amt;
        totalEarnings += amt;
      } else if (comm.status === 'approved' || comm.status === 'pending') {
        pendingEarnings += amt;
        totalEarnings += amt;
      }
    });

    return {
      totalEarnings,
      pendingEarnings,
      paidEarnings,
      totalClicks: clickCount,
      totalConversions: commissions.length,
      commissions,
    };
  }
}

module.exports = new AffiliateService();

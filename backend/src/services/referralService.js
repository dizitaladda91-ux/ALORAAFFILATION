const affiliateRepository = require('../repositories/affiliateRepository');
const referralRepository = require('../repositories/referralRepository');
const commissionRepository = require('../repositories/commissionRepository');
const ApiError = require('../utils/apiError');
const config = require('../config/env');

class ReferralService {
  async trackClick({ referralCode, ipAddress, userAgent, referrerUrl }) {
    const link = await affiliateRepository.findLinkByCode(referralCode);
    
    // Record click event regardless of link existing for tracking stats
    const click = await affiliateRepository.recordClick({
      affiliateLinkId: link ? link.id : null,
      referralCode,
      ipAddress,
      userAgent,
      referrerUrl,
    });

    // Older default links pointed back to /ref/:code, which would cause a
    // redirect loop. Keep existing campaign links intact, but route those
    // legacy defaults to the storefront.
    const legacyDefaultUrl = `${config.frontendUrl}/ref/${referralCode}`;
    const targetUrl = link && link.target_url === legacyDefaultUrl
      ? config.storefrontUrl
      : (link ? link.target_url : '/');

    return {
      clickId: click.id,
      targetUrl,
      valid: !!link,
    };
  }

  async processConversion({ referralCode, orderId, amount, currency = 'USD', clickId = null }) {
    const link = await affiliateRepository.findLinkByCode(referralCode);
    if (!link) {
      throw ApiError.notFound(`Invalid referral code: ${referralCode}`);
    }

    // 1. Create conversion event
    const conversion = await commissionRepository.createConversion({
      clickId,
      referralId: null,
      affiliateId: link.user_id,
      orderId,
      amount,
      currency,
    });

    // 2. Fetch active commission rule
    const rule = await commissionRepository.findActiveRule();
    let commissionRate = rule ? parseFloat(rule.value) : 15.0; // Default 15%
    let commissionType = rule ? rule.type : 'percentage';

    let commissionAmount = 0;
    if (commissionType === 'percentage') {
      commissionAmount = (amount * commissionRate) / 100;
    } else {
      commissionAmount = commissionRate;
    }

    // 3. Create commission record for direct affiliate
    const commission = await commissionRepository.createCommission({
      affiliateId: link.user_id,
      conversionId: conversion.id,
      ruleId: rule ? rule.id : null,
      amount: commissionAmount.toFixed(2),
      rate: commissionRate,
      status: 'pending',
    });

    return {
      conversion,
      commission,
    };
  }

  async getTeamMembers(superAffiliateId) {
    return referralRepository.findTeamMembers(superAffiliateId);
  }
}

module.exports = new ReferralService();

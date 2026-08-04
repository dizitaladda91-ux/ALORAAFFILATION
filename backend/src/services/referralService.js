const affiliateRepository = require('../repositories/affiliateRepository');
const referralRepository = require('../repositories/referralRepository');
const commissionRepository = require('../repositories/commissionRepository');
const ApiError = require('../utils/apiError');
const config = require('../config/env');
const { ROLES } = require('../constants/roles');
const { SHOPPING_COMMISSION_TIERS, RECRUITMENT_TEAM_TIERS } = require('../constants/affiliateLink.constants');

const STANDARD_AFFILIATE_TIERS = SHOPPING_COMMISSION_TIERS;

const getStandardAffiliateTier = (amount) =>
  STANDARD_AFFILIATE_TIERS.find((tier) => amount <= tier.maximumOrderAmount);

class ReferralService {
  async trackClick({ referralCode, ipAddress, userAgent, referrerUrl }) {
    const link = await affiliateRepository.findLinkByCode(referralCode);
    if (link && (!link.is_active || link.user_status !== 'active')) throw ApiError.notFound('Referral link is inactive');
    
    // Record click event regardless of link existing for tracking stats
    const click = await affiliateRepository.recordClick({
      affiliateLinkId: link ? link.id : null,
      referralCode,
      linkType: link?.link_type || null,
      ipAddress,
      userAgent,
      referrerUrl,
    });

    // Older default links pointed back to /ref/:code, which would cause a
    // redirect loop. Keep existing campaign links intact, but route those
    // legacy defaults to the storefront.
    const legacyReferralUrl = new RegExp(`/ref/${referralCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`, 'i');
    const destinationUrl = link && legacyReferralUrl.test(link.target_url)
      ? config.storefrontUrl
      : (link ? link.target_url : '/');

    // Pass attribution through to the ecommerce storefront.  Its checkout
    // integration can submit these two values to POST /referrals/conversion
    // after payment is confirmed.
    let targetUrl = destinationUrl;
    try {
      const url = new URL(destinationUrl);
      url.searchParams.set('ref', referralCode);
      url.searchParams.set('click_id', click.id);
      // The storefront reads this verified referral context and applies the
      // affiliate offer at cart/checkout. Do not add it for unknown links.
      if (link) {
        url.searchParams.set('affiliate_discount', String(config.affiliateDiscountPercent));
      }
      targetUrl = url.toString();
    } catch (_) {
      // A malformed custom destination must not stop click tracking.
    }

    return {
      clickId: click.id,
      targetUrl,
      valid: !!link,
      discount: link
        ? { percent: config.affiliateDiscountPercent, source: 'affiliate_link' }
        : null,
    };
  }

  async getAffiliateDiscount(referralCode) {
    const link = await affiliateRepository.findLinkByCode(referralCode);
    if (!link || link.link_type !== 'SHOPPING' || !link.is_active || link.user_status !== 'active') {
      throw ApiError.notFound(`Invalid referral code: ${referralCode}`);
    }

    return {
      referralCode: link.referral_code,
      valid: true,
      discountPercent: config.affiliateDiscountPercent,
    };
  }

  async processConversion({ referralCode, orderId, amount, grossAmount = amount, discountAmount = 0, eligibleAmount = amount, currency = 'INR', clickId = null }) {
    const link = await affiliateRepository.findLinkByCode(referralCode);
    if (!link || link.link_type !== 'SHOPPING' || !link.is_active || link.user_status !== 'active') {
      throw ApiError.notFound(`Invalid referral code: ${referralCode}`);
    }

    // A payment provider may retry its webhook.  One ecommerce order must
    // create only one conversion and one commission.
    const existingConversion = await commissionRepository.findConversionByOrderId(orderId);
    if (existingConversion) {
      return { conversion: existingConversion, commission: existingConversion.commission, alreadyRecorded: true };
    }

    // 1. Create conversion event
    const conversion = await commissionRepository.createConversion({
      clickId,
      referralId: null,
      affiliateId: link.user_id,
      orderId,
      amount,
      grossAmount,
      discountAmount,
      eligibleAmount,
      currency,
    });

    // 2. Standard affiliates use the fixed purchase-value slabs. The highest
    // slab continues for orders above 2,000, so every eligible sale earns a
    // commission. Other affiliate roles keep using the admin-configured rule.
    const isShoppingAffiliate = [ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE].includes(link.affiliate_role);
    const rule = isShoppingAffiliate ? await commissionRepository.findMatchingRule({ eventType: 'shopping', eligibleAmount }) : await commissionRepository.findActiveRule();
    if (!rule) throw ApiError.badRequest('No active commission rule matches this conversion');
    const commissionRate = parseFloat(rule.value);
    const commissionType = rule.type;

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
      ruleId: rule.id,
      amount: commissionAmount.toFixed(2),
      rate: commissionRate,
      status: 'pending',
    });

    return {
      conversion,
      commission,
      commissionTier: isShoppingAffiliate ? { label: rule.name, rate: commissionRate } : null,
      alreadyRecorded: false,
    };
  }

  async getTeamMembers(superAffiliateId, role, { page = 1, limit = 20 } = {}) {
    if (role !== ROLES.SUPER_AFFILIATE) throw ApiError.forbidden('Only super affiliates can access a recruitment team');
    const safePage = Math.max(1, Number(page)); const safeLimit = Math.min(100, Math.max(1, Number(limit)));
    const [items, stats] = await Promise.all([referralRepository.findTeamMembers(superAffiliateId, { limit: safeLimit, offset: (safePage - 1) * safeLimit }), referralRepository.getTeamStats(superAffiliateId)]);
    const total = Number(stats.total_team_members); const tier = RECRUITMENT_TEAM_TIERS.find((item) => total <= item.maximumTeamMembers);
    return { items, stats: { totalTeamMembers: total, totalAffiliates: Number(stats.total_affiliates), totalSuperAffiliates: Number(stats.total_super_affiliates), activeMembers: Number(stats.active_members), currentRecruitmentCommissionRate: tier.rate }, pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } };
  }
}

module.exports = new ReferralService();

jest.mock('../repositories/affiliateRepository', () => ({
  findLinkByCode: jest.fn(),
  recordClick: jest.fn(),
}));

jest.mock('../repositories/referralRepository', () => ({
  findTeamMembers: jest.fn(),
  getTeamStats: jest.fn(),
}));

jest.mock('../repositories/commissionRepository', () => ({
  findConversionByOrderId: jest.fn(),
  createConversion: jest.fn(),
  createCommission: jest.fn(),
  findActiveRule: jest.fn(),
  findMatchingRule: jest.fn(),
}));

const referralService = require('../services/referralService');
const affiliateRepository = require('../repositories/affiliateRepository');
const commissionRepository = require('../repositories/commissionRepository');
const referralRepository = require('../repositories/referralRepository');

describe('referral service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns an existing conversion without creating duplicates', async () => {
    affiliateRepository.findLinkByCode.mockResolvedValue({ user_id: 3, referral_code: 'AFF123', affiliate_role: 'affiliate', link_type: 'SHOPPING', is_active: true, user_status: 'active' });
    commissionRepository.findConversionByOrderId.mockResolvedValue({ id: 100, commission: { id: 999 } });

    const result = await referralService.processConversion({ referralCode: 'AFF123', orderId: 'order-1', amount: 250 });

    expect(result.alreadyRecorded).toBe(true);
    expect(commissionRepository.createConversion).not.toHaveBeenCalled();
  });

  it('creates a new commission for a fresh conversion', async () => {
    affiliateRepository.findLinkByCode.mockResolvedValue({ user_id: 3, referral_code: 'AFF123', affiliate_role: 'affiliate', link_type: 'SHOPPING', is_active: true, user_status: 'active' });
    commissionRepository.findConversionByOrderId.mockResolvedValue(null);
    commissionRepository.createConversion.mockResolvedValue({ id: 101 });
    commissionRepository.createCommission.mockResolvedValue({ id: 201, amount: '25.00' });
    commissionRepository.findMatchingRule.mockResolvedValue({ id: 1, name: 'Shopping slab 0-1000', type: 'percentage', value: '10.00' });

    const result = await referralService.processConversion({ referralCode: 'AFF123', orderId: 'order-2', amount: 250 });

    expect(result.alreadyRecorded).toBe(false);
    expect(commissionRepository.createCommission).toHaveBeenCalled();
    expect(result.commission.amount).toBe('25.00');
  });

  it('creates a 5% team commission for a recruited affiliate conversion', async () => {
    affiliateRepository.findLinkByCode.mockResolvedValue({ user_id: 3, parent_affiliate_id: 8, referral_code: 'AFF123', affiliate_role: 'affiliate', link_type: 'SHOPPING', is_active: true, user_status: 'active' });
    commissionRepository.findConversionByOrderId.mockResolvedValue(null);
    commissionRepository.createConversion.mockResolvedValue({ id: 102 });
    commissionRepository.findMatchingRule.mockResolvedValue({ id: 1, name: 'Shopping slab 0-1000', type: 'percentage', value: '10.00' });
    commissionRepository.createCommission
      .mockResolvedValueOnce({ id: 202, amount: '25.00' })
      .mockResolvedValueOnce({ id: 203, amount: '12.50', commission_type: 'TEAM' });
    referralRepository.getTeamStats.mockResolvedValue({ total_team_members: 10 });

    const result = await referralService.processConversion({ referralCode: 'AFF123', orderId: 'order-3', amount: 250 });

    expect(result.teamCommission.amount).toBe('12.50');
    expect(commissionRepository.createCommission).toHaveBeenLastCalledWith(expect.objectContaining({ affiliateId: 8, rate: 5, commissionType: 'TEAM' }));
  });
});

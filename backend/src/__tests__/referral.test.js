jest.mock('../repositories/affiliateRepository', () => ({
  findLinkByCode: jest.fn(),
  recordClick: jest.fn(),
}));

jest.mock('../repositories/referralRepository', () => ({
  findTeamMembers: jest.fn(),
}));

jest.mock('../repositories/commissionRepository', () => ({
  findConversionByOrderId: jest.fn(),
  createConversion: jest.fn(),
  createCommission: jest.fn(),
  findActiveRule: jest.fn(),
}));

const referralService = require('../services/referralService');
const affiliateRepository = require('../repositories/affiliateRepository');
const commissionRepository = require('../repositories/commissionRepository');

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
    commissionRepository.findActiveRule.mockResolvedValue(null);

    const result = await referralService.processConversion({ referralCode: 'AFF123', orderId: 'order-2', amount: 250 });

    expect(result.alreadyRecorded).toBe(false);
    expect(commissionRepository.createCommission).toHaveBeenCalled();
    expect(result.commission.amount).toBe('25.00');
  });
});

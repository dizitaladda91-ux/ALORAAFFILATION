const db = require('../database');

class ReferralRepository {
  async createReferral({ referrerId, referredUserId, referralCode, status = 'pending' }) {
    const res = await db.query(
      `INSERT INTO referrals (referrer_id, referred_user_id, referral_code, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [referrerId, referredUserId, referralCode, status]
    );
    return res.rows[0];
  }

  async findByReferredUser(referredUserId) {
    const res = await db.query(
      `SELECT * FROM referrals WHERE referred_user_id = $1 AND deleted_at IS NULL`,
      [referredUserId]
    );
    return res.rows[0] || null;
  }

  async findTeamMembers(superAffiliateId) {
    const res = await db.query(
      `SELECT u.id, u.email, u.status, u.created_at,
              p.first_name, p.last_name, p.company,
              COALESCE(SUM(c.amount), 0) as total_earnings,
              COALESCE(COUNT(ce.id), 0) as total_conversions
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN commissions c ON c.affiliate_id = u.id AND c.status = 'paid'
       LEFT JOIN conversion_events ce ON ce.affiliate_id = u.id
       WHERE u.parent_affiliate_id = $1 AND u.deleted_at IS NULL
       GROUP BY u.id, p.first_name, p.last_name, p.company
       ORDER BY u.created_at DESC`,
      [superAffiliateId]
    );
    return res.rows;
  }
}

module.exports = new ReferralRepository();

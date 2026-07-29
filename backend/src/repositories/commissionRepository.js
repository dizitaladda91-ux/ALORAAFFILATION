const db = require('../database');

class CommissionRepository {
  async findActiveRule() {
    const res = await db.query(
      `SELECT * FROM commission_rules WHERE is_active = true AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`
    );
    return res.rows[0] || null;
  }

  async findAllRules() {
    const res = await db.query(
      `SELECT cr.*, p.first_name, p.last_name 
       FROM commission_rules cr
       LEFT JOIN users u ON cr.created_by = u.id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE cr.deleted_at IS NULL 
       ORDER BY cr.created_at DESC`
    );
    return res.rows;
  }

  async createRule({ name, type, value, createdBy }) {
    const res = await db.query(
      `INSERT INTO commission_rules (name, type, value, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, type, value, createdBy]
    );
    return res.rows[0];
  }

  async createConversion({ clickId, referralId, affiliateId, orderId, amount, currency = 'USD' }) {
    const res = await db.query(
      `INSERT INTO conversion_events (click_id, referral_id, affiliate_id, order_id, amount, currency)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [clickId, referralId, affiliateId, orderId, amount, currency]
    );
    return res.rows[0];
  }

  async findConversionByOrderId(orderId) {
    const res = await db.query(
      `SELECT ce.*, c.id AS commission_id, c.amount AS commission_amount, c.rate AS commission_rate, c.status AS commission_status
       FROM conversion_events ce
       LEFT JOIN commissions c ON c.conversion_id = ce.id AND c.deleted_at IS NULL
       WHERE ce.order_id = $1 AND ce.deleted_at IS NULL
       LIMIT 1`,
      [orderId]
    );
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      commission: row.commission_id
        ? { id: row.commission_id, amount: row.commission_amount, rate: row.commission_rate, status: row.commission_status }
        : null,
    };
  }

  async createCommission({ affiliateId, conversionId, ruleId, amount, rate, status = 'pending' }) {
    const res = await db.query(
      `INSERT INTO commissions (affiliate_id, conversion_id, rule_id, amount, rate, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [affiliateId, conversionId, ruleId, amount, rate, status]
    );
    return res.rows[0];
  }

  async findCommissionsByAffiliate(affiliateId) {
    const res = await db.query(
      `SELECT c.*, ce.order_id, ce.amount as order_amount, ce.currency
       FROM commissions c
       LEFT JOIN conversion_events ce ON c.conversion_id = ce.id
       WHERE c.affiliate_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC`,
      [affiliateId]
    );
    return res.rows;
  }

  async updateCommissionStatus(commissionId, status) {
    const res = await db.query(
      `UPDATE commissions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, commissionId]
    );
    return res.rows[0];
  }

  async getDashboardSummary(userId = null, role = null) {
    if (role === 'affiliate' || role === 'super_affiliate') {
      const statsRes = await db.query(
        `SELECT 
           COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
           COALESCE(SUM(CASE WHEN status = 'approved' OR status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
           COUNT(id) as total_commissions
         FROM commissions
         WHERE affiliate_id = $1 AND deleted_at IS NULL`,
        [userId]
      );
      return statsRes.rows[0];
    } else {
      // Global Admin Summary
      const statsRes = await db.query(
        `SELECT 
           COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_commission_paid,
           COALESCE(SUM(amount), 0) as total_revenue_generated,
           COUNT(id) as total_conversions
         FROM commissions
         WHERE deleted_at IS NULL`
      );
      return statsRes.rows[0];
    }
  }
}

module.exports = new CommissionRepository();

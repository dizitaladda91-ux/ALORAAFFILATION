const db = require('../database');

class AffiliateRepository {
  async createLink({ userId, referralCode, targetUrl, title = 'Main Referral Link' }) {
    const res = await db.query(
      `INSERT INTO affiliate_links (user_id, referral_code, target_url, title)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, referralCode, targetUrl, title]
    );
    return res.rows[0];
  }

  async findLinkByCode(referralCode) {
    const res = await db.query(
      `SELECT al.*, u.status as user_status, r.name AS affiliate_role
       FROM affiliate_links al
       JOIN users u ON al.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       WHERE al.referral_code = $1 AND al.deleted_at IS NULL`,
      [referralCode]
    );
    return res.rows[0] || null;
  }

  async findLinksByUserId(userId) {
    const res = await db.query(
      `SELECT * FROM affiliate_links WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async recordClick({ affiliateLinkId, referralCode, ipAddress, userAgent, referrerUrl }) {
    // 1. Insert click event
    const res = await db.query(
      `INSERT INTO click_events (affiliate_link_id, referral_code, ip_address, user_agent, referrer_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [affiliateLinkId, referralCode, ipAddress, userAgent, referrerUrl]
    );

    // 2. Increment click count on affiliate link
    if (affiliateLinkId) {
      await db.query(
        `UPDATE affiliate_links SET click_count = click_count + 1 WHERE id = $1`,
        [affiliateLinkId]
      );
    }

    return res.rows[0];
  }

  async getClickStats(userId) {
    const res = await db.query(
      `SELECT COUNT(ce.id) as total_clicks
       FROM click_events ce
       JOIN affiliate_links al ON ce.affiliate_link_id = al.id
       WHERE al.user_id = $1 AND ce.deleted_at IS NULL`,
      [userId]
    );
    return parseInt(res.rows[0].total_clicks || 0, 10);
  }
}

module.exports = new AffiliateRepository();

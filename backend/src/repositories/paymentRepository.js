class PaymentRepository {
  async findReferralContext(client, referralCode, clickId) {
    const result = await client.query(
      `SELECT al.id AS affiliate_link_id, al.user_id AS affiliate_id, u.parent_affiliate_id, al.referral_code, r.name AS affiliate_role,
              ce.id AS click_id
       FROM affiliate_links al
       JOIN users u ON u.id = al.user_id AND u.status = 'active' AND u.deleted_at IS NULL
       JOIN roles r ON r.id = u.role_id
       JOIN click_events ce ON ce.id = $2 AND ce.affiliate_link_id = al.id AND ce.referral_code = al.referral_code AND ce.deleted_at IS NULL
       WHERE al.referral_code = $1 AND al.link_type = 'SHOPPING' AND al.is_active = true AND al.deleted_at IS NULL`, [referralCode, clickId]);
    return result.rows[0] || null;
  }
  async createPayment(client, payment) {
    const result = await client.query(
      `INSERT INTO payments (gateway_order_id, affiliate_id, click_id, referral_code, customer, amount, original_amount, discount_amount, currency, status, gateway_response)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'CREATED',$10) RETURNING *`,
      [payment.gatewayOrderId, payment.affiliateId, payment.clickId, payment.referralCode, JSON.stringify(payment.customer || {}), payment.amount, payment.originalAmount, payment.discountAmount, payment.currency, JSON.stringify(payment.gatewayResponse)]);
    return result.rows[0];
  }
  async findByGatewayOrderId(client, orderId) { const r = await client.query('SELECT * FROM payments WHERE gateway_order_id = $1 FOR UPDATE', [orderId]); return r.rows[0] || null; }
  async updatePayment(client, id, fields) {
    const r = await client.query(`UPDATE payments SET gateway_payment_id = COALESCE($2,gateway_payment_id), status = $3, gateway_response = COALESCE($4,gateway_response), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [id, fields.paymentId || null, fields.status, fields.gatewayResponse ? JSON.stringify(fields.gatewayResponse) : null]); return r.rows[0];
  }
  async recordWebhook(client, eventId, eventType, payload) {
    const r = await client.query(`INSERT INTO webhook_events (gateway_event_id,event_type,payload,status) VALUES ($1,$2,$3,'RECEIVED') ON CONFLICT (gateway_event_id) DO NOTHING RETURNING *`, [eventId, eventType, JSON.stringify(payload)]); return r.rows[0] || null;
  }
  async completeWebhook(client, eventId) { await client.query(`UPDATE webhook_events SET status='PROCESSED', processed_at=CURRENT_TIMESTAMP WHERE gateway_event_id=$1`, [eventId]); }
  async createConversionAndCommission(client, payment) {
    const existing = await client.query(`SELECT id FROM conversion_events WHERE order_id=$1 AND deleted_at IS NULL`, [payment.gateway_order_id]);
    if (existing.rows[0]) return { alreadyRecorded: true };
    const conversion = await client.query(`INSERT INTO conversion_events (click_id, affiliate_id, order_id, amount, currency) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [payment.click_id, payment.affiliate_id, payment.gateway_order_id, payment.amount, payment.currency]);
    let rate = 15; let ruleId = null;
    if (['affiliate', 'super_affiliate'].includes(payment.affiliate_role)) {
      const rule = await client.query(`SELECT * FROM commission_rules WHERE event_type='shopping' AND is_active=TRUE AND deleted_at IS NULL AND minimum_amount <= $1 AND (maximum_amount IS NULL OR maximum_amount >= $1) ORDER BY minimum_amount DESC LIMIT 1`, [payment.amount]);
      if (!rule.rows[0]) throw new Error('No active shopping commission rule matches this payment');
      rate = Number(rule.rows[0].value); ruleId = rule.rows[0].id;
    } else { const rule = await client.query(`SELECT * FROM commission_rules WHERE event_type='generic' AND is_active=true AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`); if (rule.rows[0]) { rate = Number(rule.rows[0].value); ruleId = rule.rows[0].id; } }
    const commission = await client.query(`INSERT INTO commissions (affiliate_id,conversion_id,rule_id,amount,rate,status,commission_type) VALUES ($1,$2,$3,$4,$5,'pending','DIRECT') RETURNING *`, [payment.affiliate_id, conversion.rows[0].id, ruleId, (Number(payment.amount) * rate / 100).toFixed(2), rate]);
    let teamCommission = null;
    if (payment.affiliate_role === 'affiliate' && payment.parent_affiliate_id) {
      const team = await client.query(`SELECT COUNT(*)::INTEGER AS total FROM users WHERE parent_affiliate_id=$1 AND deleted_at IS NULL`, [payment.parent_affiliate_id]);
      const teamRate = Number(team.rows[0].total) <= 15 ? 5 : 7;
      const created = await client.query(`INSERT INTO commissions (affiliate_id,conversion_id,rule_id,amount,rate,status,commission_type) VALUES ($1,$2,NULL,$3,$4,'pending','TEAM') RETURNING *`, [payment.parent_affiliate_id, conversion.rows[0].id, (Number(payment.amount) * teamRate / 100).toFixed(2), teamRate]);
      teamCommission = created.rows[0];
    }
    return { conversion: conversion.rows[0], commission: commission.rows[0], teamCommission, alreadyRecorded: false };
  }
}
module.exports = new PaymentRepository();

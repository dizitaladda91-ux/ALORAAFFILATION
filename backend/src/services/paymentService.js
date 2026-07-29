const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../database');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const paymentRepository = require('../repositories/paymentRepository');

class PaymentService {
  constructor() { this.client = null; }
  gateway() {
    if (!config.razorpay.keyId || !config.razorpay.keySecret) throw ApiError.internal('Razorpay is not configured');
    return new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
  }
  async createOrder({ amount, currency = 'INR', customer, referralCode, clickId }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const context = await paymentRepository.findReferralContext(client, referralCode, clickId);
      if (!context) throw ApiError.badRequest('Referral code, click ID, or affiliate is invalid');
      const originalAmount = Number(amount);
      const discountAmount = Number((originalAmount * config.affiliateDiscountPercent / 100).toFixed(2));
      const finalAmount = Number((originalAmount - discountAmount).toFixed(2));
      const order = await this.gateway().orders.create({ amount: Math.round(finalAmount * 100), currency, receipt: `aff_${Date.now()}_${clickId.slice(0, 8)}`, notes: { referralCode, clickId, affiliateId: context.affiliate_id } });
      await paymentRepository.createPayment(client, { gatewayOrderId: order.id, affiliateId: context.affiliate_id, clickId, referralCode, customer, amount: finalAmount, originalAmount, discountAmount, currency, gatewayResponse: order });
      await client.query('COMMIT');
      return { keyId: config.razorpay.keyId, orderId: order.id, amount: order.amount, currency: order.currency, customer: customer || {} };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  verifySignature(orderId, paymentId, signature) {
    const expected = crypto.createHmac('sha256', config.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    const supplied = Buffer.from(signature, 'utf8');
    return supplied.length === Buffer.byteLength(expected) && crypto.timingSafeEqual(Buffer.from(expected), supplied);
  }
  async verifyPayment({ orderId, paymentId, signature }) {
    if (!this.verifySignature(orderId, paymentId, signature)) throw ApiError.badRequest('Invalid payment signature');
    const gatewayPayment = await this.gateway().payments.fetch(paymentId);
    if (gatewayPayment.order_id !== orderId) throw ApiError.badRequest('Payment does not belong to this order');
    return this.processGatewayPayment(orderId, paymentId, gatewayPayment.status === 'captured' ? 'SUCCESS' : 'PENDING', gatewayPayment);
  }
  async processGatewayPayment(orderId, paymentId, status, gatewayResponse) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const payment = await paymentRepository.findByGatewayOrderId(client, orderId);
      if (!payment) throw ApiError.notFound('Payment order not found');
      const updated = await paymentRepository.updatePayment(client, payment.id, { paymentId, status, gatewayResponse });
      let result = null;
      if (status === 'SUCCESS') result = await paymentRepository.createConversionAndCommission(client, { ...updated, affiliate_role: (await paymentRepository.findReferralContext(client, updated.referral_code, updated.click_id)).affiliate_role });
      await client.query('COMMIT');
      return { payment: updated, conversion: result?.conversion || null, commission: result?.commission || null, pending: status !== 'SUCCESS' };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async webhook(rawBody, signature) {
    if (!config.razorpay.webhookSecret) throw ApiError.internal('Razorpay webhook secret is not configured');
    const expected = crypto.createHmac('sha256', config.razorpay.webhookSecret).update(rawBody).digest('hex');
    const supplied = Buffer.from(signature || '', 'utf8');
    if (supplied.length !== Buffer.byteLength(expected) || !crypto.timingSafeEqual(Buffer.from(expected), supplied)) throw ApiError.unauthorized('Invalid webhook signature');
    const payload = JSON.parse(rawBody.toString('utf8'));
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const received = await paymentRepository.recordWebhook(client, payload.event_id, payload.event, payload);
      if (!received) { await client.query('COMMIT'); return { duplicate: true }; }
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity;
    if (payload.event === 'payment.captured' || payload.event === 'order.paid') await this.processGatewayPayment(entity.order_id || entity.id, entity.id || payload.payload?.payment?.entity?.id, 'SUCCESS', entity);
    else if (payload.event === 'payment.failed') await this.processGatewayPayment(entity.order_id, entity.id, 'FAILED', entity);
    return { ignored: !['payment.captured', 'order.paid', 'payment.failed', 'refund.created', 'refund.processed', 'payment.authorized'].includes(payload.event) };
  }
}
module.exports = new PaymentService();

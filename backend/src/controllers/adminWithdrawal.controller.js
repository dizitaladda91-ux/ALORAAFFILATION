const asyncHandler = require('../utils/asyncHandler');
const withdrawalRepository = require('../repositories/withdrawal.repository');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/apiError');
const db = require('../database');
const walletRepository = require('../repositories/walletrepository');
const emailService = require('../services/emailService');
const logger = require('../logs/logger');
const logRepository = require('../repositories/logRepository');

exports.list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1)); const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20))); const filters = { status: req.query.status };
  const [items, total] = await Promise.all([withdrawalRepository.findAll(filters, limit, (page - 1) * limit), withdrawalRepository.count(filters)]);
  const totalRecords = Number(total);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  res.json({ success: true, data: { items, pagination: { page, limit, total: totalRecords, totalPages, hasNextPage: page < totalPages } } });
});
exports.approve = asyncHandler(async (req, res) => {
  const withdrawal = await withdrawalRepository.findById(req.params.id);
  if (!withdrawal) throw ApiError.notFound('Withdrawal request not found.');
  if (withdrawal.status !== 'pending') throw ApiError.badRequest('Only pending requests can be approved.');
  const approved = await withdrawalRepository.approve(req.params.id, req.user.id, req.body.notes);
  await logRepository.createAuditLog({ actorId: req.user.id, targetUserId: withdrawal.user_id, action: 'WITHDRAWAL_APPROVED', changesJson: { withdrawalId: withdrawal.id, withdrawalNumber: withdrawal.withdrawal_number, notes: req.body.notes || null }, ipAddress: req.ip });
  // Send approval email asynchronously
  try {
    const user = await userRepository.findById(withdrawal.user_id);
    if (user && user.email) {
      emailService.sendWithdrawalApprovedEmail(user, {
        amount: withdrawal.amount,
        approved_at: new Date(),
      }).catch(err => logger.error('Failed to send withdrawal approval email:', err));
    }
  } catch (emailError) {
    logger.error('Error sending withdrawal approval email:', emailError);
    // Don't throw - email is non-critical
  }
  res.json({ success: true, data: approved });
});
exports.reject = asyncHandler(async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const withdrawal = await withdrawalRepository.lockWithdrawal(req.params.id, client);
    if (!withdrawal) throw ApiError.notFound('Withdrawal request not found.');
    if (withdrawal.status !== 'pending') throw ApiError.badRequest('Only pending requests can be rejected.');
    const wallet = await walletRepository.findByUserId(withdrawal.user_id, client);
    const lockedWallet = await walletRepository.lockWallet(wallet.id, client);
    const updatedWallet = await walletRepository.releaseBalance(lockedWallet.id, Number(withdrawal.amount), client);
    const result = await withdrawalRepository.reject(withdrawal.id, req.body.notes || 'Rejected by administrator.', req.user.id, client);
    await walletRepository.createTransaction({ walletId: lockedWallet.id, userId: withdrawal.user_id, type: 'WITHDRAWAL_RELEASE', referenceType: 'withdrawal', referenceId: String(withdrawal.id), amount: withdrawal.amount, openingBalance: lockedWallet.available_balance, closingBalance: updatedWallet.available_balance, description: `Withdrawal ${withdrawal.withdrawal_number} rejected`, status: 'SUCCESS', createdBy: req.user.id }, client);
    await client.query('COMMIT');
    await logRepository.createAuditLog({ actorId: req.user.id, targetUserId: withdrawal.user_id, action: 'WITHDRAWAL_REJECTED', changesJson: { withdrawalId: withdrawal.id, withdrawalNumber: withdrawal.withdrawal_number, notes: req.body.notes || null }, ipAddress: req.ip });
    // Send rejection email asynchronously
    try {
      const user = await userRepository.findById(withdrawal.user_id);
      if (user && user.email) {
        emailService.sendWithdrawalRejectedEmail(user, {
          amount: withdrawal.amount,
        }, req.body.notes || 'Rejected by administrator.').catch(err => logger.error('Failed to send withdrawal rejection email:', err));
      }
    } catch (emailError) {
      logger.error('Error sending withdrawal rejection email:', emailError);
      // Don't throw - email is non-critical
    }
    res.json({ success: true, data: result });
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});

exports.exportCsv = asyncHandler(async (req, res) => {
  const items = await withdrawalRepository.findAll({}, 1000, 0);
  const header = ['ID', 'Withdrawal Number', 'User Email', 'Amount', 'Payment Method', 'Status', 'Notes', 'Created At'];
  const csvRows = [header.join(',')];

  for (const item of items) {
    const row = [
      `"${item.id}"`,
      `"${item.withdrawal_number || ''}"`,
      `"${item.user_email || ''}"`,
      `"${item.amount || 0}"`,
      `"${item.payment_method || ''}"`,
      `"${item.status || ''}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
      `"${item.created_at || ''}"`
    ];
    csvRows.push(row.join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="withdrawals_export_${Date.now()}.csv"`);
  return res.status(200).send(csvRows.join('\n'));
});


const asyncHandler = require('../utils/asyncHandler');
const withdrawalRepository = require('../repositories/withdrawal.repository');
const ApiError = require('../utils/apiError');
const db = require('../database');
const walletRepository = require('../repositories/walletrepository');

exports.list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1); const limit = Number(req.query.limit || 20); const filters = { status: req.query.status };
  const [items, total] = await Promise.all([withdrawalRepository.findAll(filters, limit, (page - 1) * limit), withdrawalRepository.count(filters)]);
  res.json({ success: true, data: { items, pagination: { page, limit, total: Number(total) } } });
});
exports.approve = asyncHandler(async (req, res) => {
  const withdrawal = await withdrawalRepository.findById(req.params.id);
  if (!withdrawal) throw ApiError.notFound('Withdrawal request not found.');
  if (withdrawal.status !== 'pending') throw ApiError.badRequest('Only pending requests can be approved.');
  res.json({ success: true, data: await withdrawalRepository.approve(req.params.id, req.user.id, req.body.notes) });
});
exports.reject = asyncHandler(async (req, res) => {
  const client = await db.connect();
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
    await client.query('COMMIT'); res.json({ success: true, data: result });
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});

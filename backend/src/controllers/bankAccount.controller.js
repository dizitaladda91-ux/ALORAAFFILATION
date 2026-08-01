const bankAccountService = require("../services/bankAccount.service");
const bankAccountRepository = require('../repositories/bankAccount.repository');
const logRepository = require('../repositories/logRepository');

class BankAccountController {
  async getAllAccounts(req, res, next) {
    try {
      const accounts = await bankAccountRepository.findAll({ status: req.query.status, limit: Number(req.query.limit || 50) });
      return res.status(200).json({ success: true, data: accounts });
    } catch (error) { next(error); }
  }

  async createBankAccount(req, res, next) {
    try {
      const userId = req.user.id;

      const bankAccount = await bankAccountService.createBankAccount(
        userId,
        req.body
      );

      return res.status(201).json({
        success: true,
        message: "Bank account added successfully.",
        data: bankAccount,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyAccounts(req, res, next) {
    try {
      const userId = req.user.id;

      const accounts = await bankAccountService.getMyAccounts(userId);

      return res.status(200).json({
        success: true,
        message: "Bank accounts fetched successfully.",
        data: accounts,
      });
    } catch (error) {
      next(error);
    }
  }

    async getAccountById(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const account = await bankAccountService.getAccountById(
        userId,
        id
      );

      return res.status(200).json({
        success: true,
        message: "Bank account fetched successfully.",
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBankAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const updatedAccount =
        await bankAccountService.updateBankAccount(
          userId,
          id,
          req.body
        );

      return res.status(200).json({
        success: true,
        message: "Bank account updated successfully.",
        data: updatedAccount,
      });
    } catch (error) {
      next(error);
    }
  }

    async setDefaultAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await bankAccountService.setDefaultAccount(
        userId,
        id
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBankAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await bankAccountService.deleteBankAccount(
        userId,
        id
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

    async verifyAccount(req, res, next) {
    try {
      const adminId = req.user.id;
      const { id } = req.params;

      const verifiedAccount =
        await bankAccountService.verifyAccount(
          id,
          adminId
        );
      await logRepository.createAuditLog({ actorId: adminId, targetUserId: verifiedAccount.user_id, action: 'BANK_ACCOUNT_VERIFIED', changesJson: { bankAccountId: id }, ipAddress: req.ip });

      return res.status(200).json({
        success: true,
        message: "Bank account verified successfully.",
        data: verifiedAccount,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectAccount(req, res, next) {
    try {
      const adminId = req.user.id;
      const { id } = req.params;

      const rejectedAccount =
        await bankAccountService.rejectAccount(
          id,
          adminId
        );
      await logRepository.createAuditLog({ actorId: adminId, targetUserId: rejectedAccount.user_id, action: 'BANK_ACCOUNT_REJECTED', changesJson: { bankAccountId: id }, ipAddress: req.ip });

      return res.status(200).json({
        success: true,
        message: "Bank account rejected successfully.",
        data: rejectedAccount,
      });
    } catch (error) {
      next(error);
    }
  }

  


}   

module.exports = new BankAccountController();

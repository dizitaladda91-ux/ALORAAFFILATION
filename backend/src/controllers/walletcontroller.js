const WalletService = require("../services/walletservice");
const asyncHandler = require("../utils/asyncHandler");

class WalletController {

    /**
     * Get Wallet
     * GET /wallet
     */
    getWallet = asyncHandler(async (req, res) => {

        const wallet = await WalletService.getWallet(req.user.id);

        return res.status(200).json({
            success: true,
            message: "Wallet fetched successfully.",
            data: wallet
        });

    });

    /**
     * Wallet Summary
     * GET /wallet/summary
     */
    getWalletSummary = asyncHandler(async (req, res) => {

        const summary = await WalletService.getWalletSummary(req.user.id);

        return res.status(200).json({
            success: true,
            message: "Wallet summary fetched successfully.",
            data: summary
        });

    });

    /**
     * Transaction History
     * GET /wallet/transactions
     */
    getTransactions = asyncHandler(async (req, res) => {

        const {
            page = 1,
            limit = 20
        } = req.query;

        const transactions =
            await WalletService.getTransactions(
                req.user.id,
                page,
                limit
            );

        return res.status(200).json({
            success: true,
            message: "Transactions fetched successfully.",
            data: transactions
        });

    });

    /**
     * Transaction Details
     * GET /wallet/transactions/:id
     */
    getTransactionById = asyncHandler(async (req, res) => {

        const transaction =
            await WalletService.getTransactionById(
                req.params.id,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message: "Transaction fetched successfully.",
            data: transaction
        });

    });

    /**
     * Wallet Stats
     * GET /wallet/stats
     */
    getWalletStats = asyncHandler(async (req, res) => {

        const stats =
            await WalletService.getWalletStats(
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message: "Wallet statistics fetched successfully.",
            data: stats
        });

    });

    /**
     * Credit Wallet
     * POST /wallet/credit
     */
    credit = asyncHandler(async (req, res) => {

        const wallet =
            await WalletService.credit({

                userId: req.user.id,

                ...req.body,

                createdBy: req.user.id

            });

        return res.status(200).json({
            success: true,
            message: "Wallet credited successfully.",
            data: wallet
        });

    });

    /**
     * Debit Wallet
     * POST /wallet/debit
     */
    debit = asyncHandler(async (req, res) => {

        const wallet =
            await WalletService.debit({

                userId: req.user.id,

                ...req.body,

                createdBy: req.user.id

            });

        return res.status(200).json({
            success: true,
            message: "Wallet debited successfully.",
            data: wallet
        });

    });

    /**
     * Freeze Balance
     * POST /wallet/freeze
     */
    freezeBalance = asyncHandler(async (req, res) => {

        const wallet =
            await WalletService.freezeBalance({

                userId: req.user.id,

                ...req.body,

                createdBy: req.user.id

            });

        return res.status(200).json({
            success: true,
            message: "Balance frozen successfully.",
            data: wallet
        });

    });

    /**
     * Release Balance
     * POST /wallet/release
     */
    releaseBalance = asyncHandler(async (req, res) => {

        const wallet =
            await WalletService.releaseBalance({

                userId: req.user.id,

                ...req.body,

                createdBy: req.user.id

            });

        return res.status(200).json({
            success: true,
            message: "Balance released successfully.",
            data: wallet
        });

    });

    /**
     * Complete Withdrawal
     * POST /wallet/withdraw
     */
    withdraw = asyncHandler(async (req, res) => {

        const wallet =
            await WalletService.withdraw({

                userId: req.user.id,

                ...req.body,

                createdBy: req.user.id

            });

        return res.status(200).json({
            success: true,
            message: "Withdrawal completed successfully.",
            data: wallet
        });

    });

}

module.exports = new WalletController();

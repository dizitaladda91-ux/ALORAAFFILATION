const PayoutService = require("../services/payout.service");
const asyncHandler = require("../utils/asyncHandler");

class PayoutController {

    /**
     * Create Payout
     * POST /payouts
     */
    createPayout = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.createPayout({

                withdrawRequestId: req.body.withdrawRequestId,

                gateway: req.body.gateway,

                remarks: req.body.remarks,

                initiatedBy: req.user.id

            });

        return res.status(201).json({

            success: true,

            message: "Payout created successfully.",

            data: payout

        });

    });

    /**
     * Get Payout By ID
     * GET /payouts/:id
     */
    getPayoutById = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.getPayoutById(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            data: payout

        });

    });

    /**
     * Get All Payouts
     * GET /payouts
     */
    getAllPayouts = asyncHandler(async (req, res) => {

        const page = Number(req.query.page || 1);

        const limit = Number(req.query.limit || 10);

        const filters = {

            status: req.query.status,

            gateway: req.query.gateway,

            affiliateId: req.query.affiliateId,

            withdrawalId: req.query.withdrawalId,

            fromDate: req.query.fromDate,

            toDate: req.query.toDate

        };

        const payouts =
            await PayoutService.getAllPayouts(
                filters,
                page,
                limit
            );

        return res.status(200).json({

            success: true,

            data: payouts

        });

    });

        /**
     * Process Payout
     * PATCH /payouts/:id/process
     */
    processPayout = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.processPayout(
                req.params.id,
                { gatewayReference: req.body.gatewayReference, transactionReference: req.body.transactionReference },
                req.user.id
            );

        return res.status(200).json({

            success: true,

            message: "Payout moved to processing successfully.",

            data: payout

        });

    });

    /**
     * Complete Payout
     * PATCH /payouts/:id/complete
     */
    completePayout = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.completePayout(
                req.params.id,
                { gatewayReference: req.body.gatewayReference, transactionReference: req.body.transactionReference }
            );

        return res.status(200).json({

            success: true,

            message: "Payout completed successfully.",

            data: payout

        });

    });

    /**
     * Fail Payout
     * PATCH /payouts/:id/fail
     */
    failPayout = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.failPayout(
                req.params.id,
                { failureReason: req.body.failureReason, processedBy: req.user.id }
            );

        return res.status(200).json({

            success: true,

            message: "Payout marked as failed.",

            data: payout

        });

    });

        /**
     * Retry Failed Payout
     * PATCH /payouts/:id/retry
     */
    retryPayout = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.retryPayout(
                req.params.id,
                req.user.id
            );

        return res.status(200).json({

            success: true,

            message: "Payout retry initiated successfully.",

            data: payout

        });

    });

    /**
     * Cancel Payout
     * PATCH /payouts/:id/cancel
     */
    cancelPayout = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.cancelPayout(
                req.params.id,
                req.body.remarks
            );

        return res.status(200).json({

            success: true,

            message: "Payout cancelled successfully.",

            data: payout

        });

    });

    /**
     * Get Payout Statistics
     * GET /admin/payouts/statistics
     */
    getStatistics = asyncHandler(async (req, res) => {

        const statistics =
            await PayoutService.getStatistics();

        return res.status(200).json({

            success: true,

            data: statistics

        });

    });

}

module.exports = new PayoutController();

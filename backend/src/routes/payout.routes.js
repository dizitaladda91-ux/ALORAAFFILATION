const express = require("express");

const router = express.Router();

const PayoutController = require("../controllers/payout.controller");

const {
    authorizeRoles
} = require("../middlewares/rbacMiddleware");

const validate =
    require("../middlewares/validationMiddleware");

const {

    createPayoutValidation,

    getPayoutValidation,

    processPayoutValidation,

    completePayoutValidation,

    failPayoutValidation,

    cancelPayoutValidation,

    getAllPayoutsValidation,

    getStatisticsValidation

} = require("../validators/payout.validator");

const {
    authenticate
} = require("../middlewares/authMiddleware");

/**
 * Create Payout
 * POST /api/v1/payouts
 */
router.post(
    "/",
    authenticate,
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN"
    ),
    createPayoutValidation,
    validate,
    PayoutController.createPayout
);

/**
 * Get All Payouts
 * GET /api/v1/payouts
 */
router.get(
    "/",
    authenticate,
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN"
    ),
    getAllPayoutsValidation,
    validate,
    PayoutController.getAllPayouts
);

/**
 * Get Payout Statistics
 * GET /api/v1/payouts/statistics
 */
router.get(
    "/statistics",
    authenticate,
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN"
    ),
    getStatisticsValidation,
    validate,
    PayoutController.getStatistics
);

/**
 * Get Payout By ID
 * GET /api/v1/payouts/:id
 */
router.get(
    "/:id",
    authenticate,
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN"
    ),
    getPayoutValidation,
    validate,
    PayoutController.getPayoutById
);

/**
 * Process Payout
 * PATCH /api/v1/payouts/:id/process
 */
router.patch(
    "/:id/process",
    authenticate,
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN"
    ),
    processPayoutValidation,
    validate,
    PayoutController.processPayout
);

/**
 * Complete Payout
 * PATCH /api/v1/payouts/:id/complete
 */
router.patch(
    "/:id/complete",
    authenticate,
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN"
    ),
    completePayoutValidation,
    validate,
    PayoutController.completePayout
);

/**
 * Fail Payout
 * PATCH /api/v1/payouts/:id/fail
 */
router.patch(
    "/:id/fail",
    authenticate,
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN"
    ),
    failPayoutValidation,
    validate,
    PayoutController.failPayout
);

/**
 * Cancel Payout
 * PATCH /api/v1/payouts/:id/cancel
 */
router.patch(
    "/:id/cancel",
    authenticate,
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN"
    ),
    cancelPayoutValidation,
    validate,
    PayoutController.cancelPayout
);

module.exports = router;

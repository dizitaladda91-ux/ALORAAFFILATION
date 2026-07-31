const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { authenticate } = require('../middlewares/authMiddleware');
const { conversionValidator } = require('../validators/commissionValidator');
const validate = require('../middlewares/validationMiddleware');
const { requireStorefrontApiKey } = require('../middlewares/storefrontAuthMiddleware');

// Public route to record click events when visiting referral links
router.get('/click/:code', referralController.trackClick);

// Storefront checkout uses this to validate the referral before applying the
// customer-facing affiliate discount.
router.get('/discount/:code', referralController.getDiscount);

// Endpoint for e-commerce or conversion webhooks to record a sale
router.post('/conversion', requireStorefrontApiKey, conversionValidator, validate, referralController.recordConversion);

// Team tracking for super affiliates
router.get('/team', authenticate, referralController.getTeam);

module.exports = router;

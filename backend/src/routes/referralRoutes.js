const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { authenticate } = require('../middlewares/authMiddleware');
const { conversionValidator } = require('../validators/commissionValidator');
const validate = require('../middlewares/validationMiddleware');

// Public route to record click events when visiting referral links
router.get('/click/:code', referralController.trackClick);

// Endpoint for e-commerce or conversion webhooks to record a sale
router.post('/conversion', conversionValidator, validate, referralController.recordConversion);

// Team tracking for super affiliates
router.get('/team', authenticate, referralController.getTeam);

module.exports = router;

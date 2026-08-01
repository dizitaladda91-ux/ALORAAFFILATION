const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidator, loginValidator, refreshTokenValidator } = require('../validators/authValidator');
const validate = require('../middlewares/validationMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');
const { authRateLimiter } = require('../middlewares/rateLimiter');

router.post('/register', authRateLimiter, registerValidator, validate, authController.register);
router.post('/login', authRateLimiter, loginValidator, validate, authController.login);
router.post('/refresh-token', refreshTokenValidator, validate, authController.refreshToken);
router.post('/forgot-password', authRateLimiter, [require('express-validator').body('email').isEmail()], validate, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, [require('express-validator').body('token').notEmpty(), require('express-validator').body('password').isLength({ min: 8 })], validate, authController.resetPassword);
router.post('/email-verification', authenticate, authRateLimiter, authController.sendEmailVerification);
router.post('/verify-email', authRateLimiter, [require('express-validator').body('token').isString().notEmpty()], validate, authController.verifyEmail);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;

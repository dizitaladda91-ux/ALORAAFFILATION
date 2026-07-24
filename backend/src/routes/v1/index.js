const express = require('express');
const router = express.Router();

const authRoutes = require('../authRoutes');
const adminRoutes = require('../adminRoutes');
const affiliateRoutes = require('../affiliateRoutes');
const referralRoutes = require('../referralRoutes');
const commissionRoutes = require('../commissionRoutes');
const dashboardRoutes = require('../dashboardRoutes');
const profileRoutes = require('../profileRoutes');
const settingsRoutes = require('../settingsRoutes');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/affiliates', affiliateRoutes);
router.use('/referrals', referralRoutes);
router.use('/commissions', commissionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/profile', profileRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;

const userRepository = require('../repositories/userRepository');
const profileRepository = require('../repositories/profileRepository');
const affiliateRepository = require('../repositories/affiliateRepository');
const referralRepository = require('../repositories/referralRepository');
const logRepository = require('../repositories/logRepository');
const jwtUtils = require('../utils/jwtUtils');
const passwordUtils = require('../utils/passwordUtils');
const codeGenerator = require('../helpers/codeGenerator');
const ApiError = require('../utils/apiError');
const config = require('../config/env');
const emailService = require('./emailService');
const logger = require('../logs/logger');
const notificationRepository = require('../repositories/notification.repository');
const { ROLES } = require('../constants/roles');
const crypto = require('crypto');
const mfaService = require('./mfaService');

class AuthService {
  async register({ email, password, firstName, lastName, company = null, role = 'affiliate', recruitmentCode = null, ipAddress = null }) {
    if (![ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE].includes(role)) {
      throw ApiError.forbidden('Administrative accounts cannot be created through public registration');
    }
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw ApiError.conflict('Email address is already registered');
    }

    const roleObj = await userRepository.getRoleByName(role);
    if (!roleObj) {
      throw ApiError.badRequest(`Role '${role}' does not exist`);
    }

    let parentAffiliateId = null;
    let recruitmentLink = null;
    if (recruitmentCode) {
      recruitmentLink = await affiliateRepository.findLinkByCode(recruitmentCode);
      if (!recruitmentLink || recruitmentLink.link_type !== 'RECRUITMENT' || recruitmentLink.affiliate_role !== ROLES.SUPER_AFFILIATE || recruitmentLink.user_status !== 'active' || !recruitmentLink.is_active) throw ApiError.badRequest('Recruitment referral code is invalid or inactive');
      parentAffiliateId = recruitmentLink.user_id;
    }
    const passwordHash = await passwordUtils.hashPassword(password);
    
    // Status is active by default, or pending if admin approval required
    const initialStatus = role === 'affiliate' ? 'active' : 'active';

    const user = await userRepository.create({
      email,
      passwordHash,
      roleId: roleObj.id,
      status: initialStatus,
      parentAffiliateId,
    });

    // Create profile
    const profile = await profileRepository.create({
      userId: user.id,
      firstName,
      lastName,
      company,
    });

    // Automatically generate a primary affiliate link for affiliate roles
    let primaryLink = null;
    if (role === 'affiliate' || role === 'super_affiliate') {
      const referralCode = codeGenerator.generateReferralCode(role === 'super_affiliate' ? 'SUP' : 'AFF');
      primaryLink = await affiliateRepository.createLink({
        userId: user.id,
        referralCode,
        // All referral traffic should land on the public Alora Radiance store.
        // The portal URL is only the shareable tracking URL (/ref/:code).
        targetUrl: config.storefrontUrl,
        title: 'Default Shopping Link', linkType: 'SHOPPING', isSystemLink: true,
      });
      if (role === ROLES.SUPER_AFFILIATE) {
        const recruitmentReferralCode = codeGenerator.generateReferralCode('SUPTEAM');
        await affiliateRepository.createLink({ userId: user.id, referralCode: recruitmentReferralCode, targetUrl: `${config.frontendUrl.replace(/\/$/, '')}/register?ref=${encodeURIComponent(recruitmentReferralCode)}`, title: 'Default Recruitment Link', linkType: 'RECRUITMENT', isSystemLink: true });
      }
    }

    if (recruitmentLink) await referralRepository.createReferral({ referrerId: recruitmentLink.user_id, referredUserId: user.id, referralCode: recruitmentLink.referral_code, status: 'converted' });

    // Log Activity
    await logRepository.createActivityLog({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      ipAddress,
    });

    const accessToken = jwtUtils.generateAccessToken({ id: user.id, email: user.email, role: roleObj.name });
    const refreshToken = jwtUtils.generateRefreshToken({ id: user.id });
    await userRepository.updateRefreshToken(user.id, refreshToken);

    // Send welcome email asynchronously
    try {
      emailService.sendWelcomeEmail({
        email: user.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
      }).catch(err => logger.error('Failed to send welcome email:', err));
    } catch (emailError) {
      logger.error('Error sending welcome email:', emailError);
      // Don't throw - email is non-critical
    }
    this.sendEmailVerification(user.id).catch(err => logger.error('Email verification setup failed', err));

    // Send notifications to admins and new user
    try {
      notificationRepository.createForAdmins({
        title: 'New Affiliate Joined',
        message: `New ${role.replace('_', ' ')} ${profile.first_name} ${profile.last_name || ''} (${user.email}) registered on the platform.`,
        type: 'new_affiliate',
      }).catch(err => logger.error('Admin notification creation error:', err));

      notificationRepository.create({
        userId: user.id,
        title: 'Welcome to ALORA Radiance!',
        message: 'Your affiliate account is active. Share your referral link to start earning commissions.',
        type: 'welcome',
      }).catch(err => logger.error('User welcome notification creation error:', err));
    } catch (notifErr) {
      logger.error('Failed to create registration notifications:', notifErr);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        role_name: roleObj.name,
        profile,
        primaryLink,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login({ email, password, ipAddress = null }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden('Your account is not active. Please contact support.');
    }

    const isMatch = await passwordUtils.comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (config.requireAdminMfa && [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role_name)) {
      const purpose = user.mfa_enabled ? 'mfa-login' : 'mfa-setup';
      return { mfaRequired: true, mfaSetupRequired: !user.mfa_enabled, mfaToken: jwtUtils.generateMfaToken({ id: user.id }, purpose) };
    }
    return this.issueLoginTokens(user, ipAddress);
  }

  async refreshTokens(refreshToken) {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    let decoded;
    try {
      decoded = jwtUtils.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await userRepository.findSessionUserById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }
    const storedToken = user.refresh_token;
    const tokensMatch = storedToken
      && Buffer.byteLength(storedToken) === Buffer.byteLength(refreshToken)
      && crypto.timingSafeEqual(Buffer.from(storedToken), Buffer.from(refreshToken));
    if (!tokensMatch) {
      throw ApiError.unauthorized('Refresh token has been revoked or rotated');
    }
    if (user.status !== 'active') {
      throw ApiError.forbidden('This account is not active');
    }

    const newAccessToken = jwtUtils.generateAccessToken({ id: user.id, email: user.email, role: user.role_name });
    const newRefreshToken = jwtUtils.generateRefreshToken({ id: user.id });

    await userRepository.updateRefreshToken(user.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async issueLoginTokens(user, ipAddress = null) {
    const accessToken = jwtUtils.generateAccessToken({ id: user.id, email: user.email, role: user.role_name });
    const refreshToken = jwtUtils.generateRefreshToken({ id: user.id });
    await userRepository.updateRefreshToken(user.id, refreshToken);
    const fullUser = await userRepository.findById(user.id);
    await logRepository.createActivityLog({ userId: user.id, action: 'USER_LOGIN', entityType: 'USER', entityId: user.id, ipAddress });
    return { user: fullUser, tokens: { accessToken, refreshToken } };
  }

  async beginMfaSetup(mfaToken) {
    const decoded = jwtUtils.verifyMfaToken(mfaToken, 'mfa-setup');
    const user = await userRepository.findById(decoded.id);
    if (!user || ![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role_name)) throw ApiError.unauthorized('Invalid MFA setup request');
    return { secret: mfaService.generateSecret(), accountName: user.email, issuer: 'Affiliate Management' };
  }

  async enableMfa(mfaToken, secret, code, ipAddress = null) {
    const decoded = jwtUtils.verifyMfaToken(mfaToken, 'mfa-setup');
    const sessionUser = await userRepository.findSessionUserById(decoded.id);
    if (!sessionUser || ![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(sessionUser.role_name) || !mfaService.verifyCode(secret, code)) throw ApiError.unauthorized('Invalid authenticator code');
    await userRepository.enableMfa(sessionUser.id, mfaService.encrypt(secret));
    return this.issueLoginTokens(sessionUser, ipAddress);
  }

  async verifyMfaLogin(mfaToken, code, ipAddress = null) {
    const decoded = jwtUtils.verifyMfaToken(mfaToken, 'mfa-login');
    const user = await userRepository.findSessionUserById(decoded.id);
    if (!user?.mfa_enabled || !user.mfa_secret_encrypted || !mfaService.verifyCode(mfaService.decrypt(user.mfa_secret_encrypted), code)) throw ApiError.unauthorized('Invalid authenticator code');
    return this.issueLoginTokens(user, ipAddress);
  }

  async logout(userId) {
    await userRepository.updateRefreshToken(userId, null);
  }
  async requestPasswordReset(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) return;
    const token = crypto.randomBytes(32).toString('hex');
    await userRepository.savePasswordReset(user.id, crypto.createHash('sha256').update(token).digest('hex'), new Date(Date.now() + 60 * 60 * 1000));
    emailService.sendPasswordResetEmail(user, token).catch(err => logger.error('Password reset email failed', err));
  }
  async resetPassword(token, password) {
    const user = await userRepository.findByPasswordResetToken(crypto.createHash('sha256').update(token).digest('hex'));
    if (!user) throw ApiError.badRequest('Password reset link is invalid or expired');
    await userRepository.updatePassword(user.id, await passwordUtils.hashPassword(password));
    await userRepository.clearPasswordReset(user.id);
  }

  async sendEmailVerification(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    if (user.is_email_verified) return;

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await userRepository.saveEmailVerification(user.id, tokenHash, new Date(Date.now() + 24 * 60 * 60 * 1000));
    await emailService.sendEmailVerificationEmail(user, token);
  }

  async verifyEmail(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userRepository.findByEmailVerificationToken(tokenHash);
    if (!user) throw ApiError.badRequest('Email verification link is invalid or expired');
    await userRepository.verifyEmail(user.id);
    await logRepository.createActivityLog({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      entityType: 'USER',
      entityId: user.id,
    });
  }
}

module.exports = new AuthService();

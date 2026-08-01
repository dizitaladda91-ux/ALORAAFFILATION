const userRepository = require('../repositories/userRepository');
const profileRepository = require('../repositories/profileRepository');
const affiliateRepository = require('../repositories/affiliateRepository');
const logRepository = require('../repositories/logRepository');
const jwtUtils = require('../utils/jwtUtils');
const passwordUtils = require('../utils/passwordUtils');
const codeGenerator = require('../helpers/codeGenerator');
const ApiError = require('../utils/apiError');
const config = require('../config/env');
const emailService = require('./emailService');
const logger = require('../logs/logger');
const { ROLES } = require('../constants/roles');
const crypto = require('crypto');

class AuthService {
  async register({ email, password, firstName, lastName, company = null, role = 'affiliate', parentAffiliateId = null, ipAddress = null }) {
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
        title: 'Default Referral Link',
      });
    }

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

    if (user.status === 'suspended') {
      throw ApiError.forbidden('Your account has been suspended. Please contact support.');
    }

    if (user.status === 'rejected') {
      throw ApiError.forbidden('Your account registration request was rejected.');
    }

    const isMatch = await passwordUtils.comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const accessToken = jwtUtils.generateAccessToken({ id: user.id, email: user.email, role: user.role_name });
    const refreshToken = jwtUtils.generateRefreshToken({ id: user.id });

    await userRepository.updateRefreshToken(user.id, refreshToken);

    const fullUser = await userRepository.findById(user.id);

    await logRepository.createActivityLog({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      ipAddress,
    });

    return {
      user: fullUser,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refreshTokens(refreshToken) {
    let decoded;
    try {
      decoded = jwtUtils.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }

    const newAccessToken = jwtUtils.generateAccessToken({ id: user.id, email: user.email, role: user.role_name });
    const newRefreshToken = jwtUtils.generateRefreshToken({ id: user.id });

    await userRepository.updateRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
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

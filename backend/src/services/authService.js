const userRepository = require('../repositories/userRepository');
const profileRepository = require('../repositories/profileRepository');
const affiliateRepository = require('../repositories/affiliateRepository');
const logRepository = require('../repositories/logRepository');
const jwtUtils = require('../utils/jwtUtils');
const passwordUtils = require('../utils/passwordUtils');
const codeGenerator = require('../helpers/codeGenerator');
const ApiError = require('../utils/apiError');
const config = require('../config/env');

class AuthService {
  async register({ email, password, firstName, lastName, company = null, role = 'affiliate', parentAffiliateId = null, ipAddress = null }) {
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
        // Standard affiliate traffic should land on the Alora Radiance storefront.
        targetUrl: role === 'affiliate' ? config.storefrontUrl : `${config.frontendUrl}/ref/${referralCode}`,
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
}

module.exports = new AuthService();

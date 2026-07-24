const authService = require('../services/authService');
const { sendSuccess } = require('../helpers/responseHelper');
const asyncHandler = require('../utils/asyncHandler');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await authService.register({
      ...req.body,
      ipAddress: req.ip,
    });
    return sendSuccess(res, 'User registration successful', result, HTTP_STATUS.CREATED);
  });

  login = asyncHandler(async (req, res) => {
    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
      ipAddress: req.ip,
    });
    return sendSuccess(res, 'Login successful', result);
  });

  refreshToken = asyncHandler(async (req, res) => {
    const result = await authService.refreshTokens(req.body.refreshToken);
    return sendSuccess(res, 'Token refreshed successfully', result);
  });

  logout = asyncHandler(async (req, res) => {
    if (req.user) {
      await authService.logout(req.user.id);
    }
    return sendSuccess(res, 'Logout successful');
  });

  getCurrentUser = asyncHandler(async (req, res) => {
    return sendSuccess(res, 'Current user profile', { user: req.user });
  });
}

module.exports = new AuthController();

const profileRepository = require('../repositories/profileRepository');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/apiError');

class ProfileService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  async updateProfile(userId, data) {
    const updatedProfile = await profileRepository.update(userId, data);
    return this.getProfile(userId);
  }
}

module.exports = new ProfileService();

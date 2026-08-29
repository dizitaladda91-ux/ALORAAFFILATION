const db = require('../database');
const crypto = require('crypto');

class OtpRepository {
  async ensureTable() {
    await db.query(`
      CREATE TABLE IF NOT EXISTS registration_otps (
        email VARCHAR(255) PRIMARY KEY,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});
  }

  async saveOtp(email, otp) {
    await this.ensureTable();
    const normalizedEmail = (email || '').toLowerCase().trim();
    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.query(
      `
      INSERT INTO registration_otps (email, otp_hash, expires_at, is_verified, created_at)
      VALUES ($1, $2, $3, FALSE, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE
      SET otp_hash = EXCLUDED.otp_hash,
          expires_at = EXCLUDED.expires_at,
          is_verified = FALSE,
          created_at = CURRENT_TIMESTAMP;
      `,
      [normalizedEmail, otpHash, expiresAt]
    );
  }

  async verifyOtp(email, otp) {
    await this.ensureTable();
    const normalizedEmail = (email || '').toLowerCase().trim();
    const otpHash = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');

    const res = await db.query(
      `
      SELECT * FROM registration_otps
      WHERE email = $1
        AND otp_hash = $2
        AND expires_at > CURRENT_TIMESTAMP;
      `,
      [normalizedEmail, otpHash]
    );

    if (res.rows.length === 0) {
      return false;
    }

    await db.query(
      `UPDATE registration_otps SET is_verified = TRUE WHERE email = $1;`,
      [normalizedEmail]
    );

    return true;
  }

  async isEmailVerified(email) {
    await this.ensureTable();
    const normalizedEmail = (email || '').toLowerCase().trim();
    const res = await db.query(
      `SELECT is_verified FROM registration_otps WHERE email = $1 AND is_verified = TRUE;`,
      [normalizedEmail]
    );
    return res.rows.length > 0;
  }
}

module.exports = new OtpRepository();

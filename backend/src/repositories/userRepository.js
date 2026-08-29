const db = require('../database');

class UserRepository {
  async findByEmail(email) {
    await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS official_email TEXT;").catch(() => {});
    const res = await db.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE (LOWER(u.email) = $1 OR LOWER(u.official_email) = $1) AND u.deleted_at IS NULL`,
      [email.toLowerCase()]
    );
    return res.rows[0] || null;
  }

  async findById(id) {
    await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS official_email TEXT;").catch(() => {});
    const res = await db.query(
      `SELECT u.id, u.email, u.official_email, u.status, u.is_email_verified, u.parent_affiliate_id, u.created_at, u.updated_at,
              r.name as role_name, r.id as role_id,
              p.first_name, p.last_name, p.phone, p.company, p.avatar_url, p.bio
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findSessionUserById(id) {
    return this.findById(id);
  }

  async create({ email, officialEmail = null, passwordHash, roleId, status = 'active', parentAffiliateId = null }) {
    await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS official_email TEXT;").catch(() => {});
    const finalOfficialEmail = (officialEmail || email || '').toLowerCase().trim();
    const res = await db.query(
      `INSERT INTO users (email, official_email, password_hash, role_id, status, parent_affiliate_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, official_email, status, role_id, created_at`,
      [email.toLowerCase(), finalOfficialEmail, passwordHash, roleId, status, parentAffiliateId]
    );
    return res.rows[0];
  }

  async getRoleByName(roleName) {
    const res = await db.query('SELECT id, name FROM roles WHERE name = $1 AND deleted_at IS NULL', [roleName]);
    return res.rows[0] || null;
  }

  async updateRefreshToken(userId, refreshToken) {
    await db.query(
      `UPDATE users SET refresh_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [refreshToken, userId]
    );
  }

  async updateEmail(userId, email) {
    const res = await db.query(
      `UPDATE users SET email = $1, is_email_verified = FALSE,
       email_verification_token_hash = NULL, email_verification_expires_at = NULL,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, email, is_email_verified`,
      [email.toLowerCase(), userId]
    );
    return res.rows[0] || null;
  }

  async updateOfficialEmail(userId, officialEmail) {
    await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS official_email TEXT;").catch(() => {});
    const res = await db.query(
      `UPDATE users SET official_email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL RETURNING id, email, official_email`,
      [(officialEmail || '').toLowerCase().trim(), userId]
    );
    return res.rows[0] || null;
  }

  async updatePassword(userId, passwordHash) {
    await db.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL`,
      [passwordHash, userId]
    );
  }

  async savePasswordReset(userId, tokenHash, expiresAt) { await db.query('UPDATE users SET password_reset_token_hash=$1, password_reset_expires_at=$2 WHERE id=$3', [tokenHash, expiresAt, userId]); }
  async findByPasswordResetToken(tokenHash) { const res = await db.query(`SELECT u.*, p.first_name FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.password_reset_token_hash=$1 AND u.password_reset_expires_at > CURRENT_TIMESTAMP AND u.deleted_at IS NULL`, [tokenHash]); return res.rows[0] || null; }
  async clearPasswordReset(userId) { await db.query('UPDATE users SET password_reset_token_hash=NULL, password_reset_expires_at=NULL, refresh_token=NULL WHERE id=$1', [userId]); }
  async savePasswordResetToken(userId, tokenHash, expiresAt) { return this.savePasswordReset(userId, tokenHash, expiresAt); }
  async findPasswordResetToken(tokenHash) { return this.findByPasswordResetToken(tokenHash); }
  async deletePasswordResetToken(userId) { return this.clearPasswordReset(userId); }

  async saveEmailVerification(userId, tokenHash, expiresAt) {
    await db.query('UPDATE users SET email_verification_token_hash=$1, email_verification_expires_at=$2 WHERE id=$3', [tokenHash, expiresAt, userId]);
  }
  async saveEmailVerificationToken(userId, tokenHash, expiresAt) {
    return this.saveEmailVerification(userId, tokenHash, expiresAt);
  }

  async findByEmailVerificationToken(tokenHash) {
    const res = await db.query(
      `SELECT id as user_id, id, email, official_email, is_email_verified, email_verification_expires_at as expires_at FROM users
       WHERE email_verification_token_hash=$1 AND email_verification_expires_at > CURRENT_TIMESTAMP AND deleted_at IS NULL`,
      [tokenHash]
    );
    return res.rows[0] || null;
  }
  async findEmailVerificationToken(tokenHash) {
    return this.findByEmailVerificationToken(tokenHash);
  }

  async markEmailAsVerified(userId) {
    await db.query('UPDATE users SET is_email_verified=TRUE, email_verification_token_hash=NULL, email_verification_expires_at=NULL WHERE id=$1', [userId]);
  }
  async markEmailVerified(userId) {
    return this.markEmailAsVerified(userId);
  }

  async deleteEmailVerificationToken(userId) {
    await db.query('UPDATE users SET email_verification_token_hash=NULL, email_verification_expires_at=NULL WHERE id=$1', [userId]);
  }

  async count(filters = {}) {
    let query = 'SELECT COUNT(*) FROM users u WHERE u.deleted_at IS NULL';
    const params = [];
    if (filters.role) { params.push(filters.role); query += ` AND u.role_id = (SELECT id FROM roles WHERE name = $${params.length})`; }
    if (filters.status) { params.push(filters.status); query += ` AND u.status = $${params.length}`; }
    if (filters.search) { params.push(`%${filters.search}%`); query += ` AND (u.email ILIKE $${params.length} OR u.official_email ILIKE $${params.length})`; }
    const res = await db.query(query, params);
    return parseInt(res.rows[0].count, 10);
  }

  async findAll(filters = {}, limit = 20, offset = 0) {
    let query = `SELECT u.id, u.email, u.official_email, u.status, u.is_email_verified, u.created_at,
                        r.name as role_name, p.first_name, p.last_name, p.phone, p.company
                 FROM users u
                 JOIN roles r ON u.role_id = r.id
                 LEFT JOIN profiles p ON p.user_id = u.id
                 WHERE u.deleted_at IS NULL`;
    const params = [];
    if (filters.role) { params.push(filters.role); query += ` AND r.name = $${params.length}`; }
    if (filters.status) { params.push(filters.status); query += ` AND u.status = $${params.length}`; }
    if (filters.search) { params.push(`%${filters.search}%`); query += ` AND (u.email ILIKE $${params.length} OR u.official_email ILIKE $${params.length} OR p.first_name ILIKE $${params.length} OR p.last_name ILIKE $${params.length})`; }
    params.push(limit, offset);
    query += ` ORDER BY u.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const res = await db.query(query, params);
    return res.rows;
  }
}

module.exports = new UserRepository();

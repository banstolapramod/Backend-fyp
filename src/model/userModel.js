const pool = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email=$1 AND is_active=true', [email]);
    return result.rows[0] || null;
  }

  static async findById(userId) {
    const result = await pool.query('SELECT * FROM users WHERE user_id=$1 AND is_active=true', [userId]);
    return result.rows[0] || null;
  }

  static async create(name, email, hashedPassword, role = 'customer') {
    const vendorStatus = role === 'vendor' ? 'pending' : 'approved';
    const result = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, vendor_status, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING user_id as id, name, email, role, vendor_status, created_at
    `, [name, email, hashedPassword, role, vendorStatus]);
    return result.rows[0];
  }

  static async updateProfile(userId, name, email) {
    const result = await pool.query(`
      UPDATE users SET name=$1, email=$2, updated_at=NOW()
      WHERE user_id=$3 AND is_active=true
      RETURNING user_id as id, name, email, role, vendor_status
    `, [name, email, userId]);
    return result.rows[0] || null;
  }

  static async updatePassword(userId, hashedPassword) {
    const result = await pool.query(`
      UPDATE users SET password_hash=$1, updated_at=NOW()
      WHERE user_id=$2 AND is_active=true
      RETURNING user_id as id
    `, [hashedPassword, userId]);
    return result.rows[0] || null;
  }

  static async findAllVendors(limit = 100, offset = 0) {
    const result = await pool.query(`
      SELECT user_id as id, name, email, role, vendor_status, created_at, updated_at
      FROM users WHERE role='vendor' AND is_active=true
      ORDER BY created_at DESC LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }

  static async updateVendorStatus(vendorId, status) {
    const result = await pool.query(`
      UPDATE users SET vendor_status=$1, updated_at=NOW()
      WHERE user_id=$2 AND role='vendor' AND is_active=true
      RETURNING user_id as id, name, email, role, vendor_status, updated_at
    `, [status, vendorId]);
    return result.rows[0] || null;
  }

  static async findAll(limit = 100, offset = 0) {
    const result = await pool.query(`
      SELECT user_id as id, name, email, role, vendor_status, created_at, updated_at
      FROM users WHERE is_active=true
      ORDER BY created_at DESC LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }

  static async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN role='customer' THEN 1 END) as customers,
        COUNT(CASE WHEN role='vendor' THEN 1 END) as vendors,
        COUNT(CASE WHEN role='admin' THEN 1 END) as admins,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30_days
      FROM users WHERE is_active=true
    `);
    return result.rows[0];
  }

  static async countByRole(role) {
    const result = await pool.query('SELECT COUNT(*) as count FROM users WHERE role=$1 AND is_active=true', [role]);
    return parseInt(result.rows[0].count);
  }

  static async deleteById(userId) {
    const result = await pool.query(`
      UPDATE users SET is_active=false, updated_at=NOW()
      WHERE user_id=$1
      RETURNING user_id as id, name, email, role
    `, [userId]);
    return result.rows[0] || null;
  }
}

module.exports = UserModel;

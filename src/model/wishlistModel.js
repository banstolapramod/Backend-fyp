const pool = require('../config/db');

class WishlistModel {
  static async addItem(userId, productId) {
    const result = await pool.query(
      `INSERT INTO wishlist (wishlist_id, user_id, product_id)
       VALUES (gen_random_uuid(), $1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING *`,
      [userId, productId]
    );
    return result.rows[0] || null; // null = already existed
  }

  static async removeItem(userId, productId) {
    const result = await pool.query(
      `DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING wishlist_id`,
      [userId, productId]
    );
    return result.rows[0] || null;
  }

  static async getItems(userId) {
    const result = await pool.query(
      `SELECT w.wishlist_id, w.product_id,
              p.name, p.price, p.image_url, p.brand, p.category, p.stock_quantity, p.description
       FROM wishlist w
       JOIN products p ON p.product_id = w.product_id
       WHERE w.user_id = $1 AND p.is_active = true
       ORDER BY w.wishlist_id`,
      [userId]
    );
    return result.rows;
  }

  static async isInWishlist(userId, productId) {
    const result = await pool.query(
      `SELECT 1 FROM wishlist WHERE user_id = $1 AND product_id = $2`,
      [userId, productId]
    );
    return result.rows.length > 0;
  }

  static async getProductIds(userId) {
    const result = await pool.query(
      `SELECT product_id FROM wishlist WHERE user_id = $1`,
      [userId]
    );
    return result.rows.map(r => r.product_id);
  }
}

module.exports = WishlistModel;

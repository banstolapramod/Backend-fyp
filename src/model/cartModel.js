const pool = require('../config/db');

// The `cart` table stores items directly: user_id + product_id + quantity
// UNIQUE(user_id, product_id) so we upsert on conflict

class CartModel {
  // Add or increment item
  static async addItem(userId, productId, quantity) {
    const result = await pool.query(
      `INSERT INTO cart (cart_id, user_id, product_id, quantity, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity, updated_at = NOW()
       RETURNING *`,
      [userId, productId, quantity]
    );
    return result.rows[0];
  }

  // Get all cart items for a user with product details
  static async getCartItems(userId) {
    const result = await pool.query(
      `SELECT c.cart_id, c.product_id, c.quantity,
              p.name, p.price, p.image_url, p.brand, p.category, p.stock_quantity
       FROM cart c
       JOIN products p ON p.product_id = c.product_id
       WHERE c.user_id = $1 AND p.is_active = true
       ORDER BY c.created_at`,
      [userId]
    );
    return result.rows;
  }

  // Set exact quantity (replace, not increment)
  static async updateItem(userId, productId, quantity) {
    const result = await pool.query(
      `UPDATE cart SET quantity = $1, updated_at = NOW()
       WHERE user_id = $2 AND product_id = $3
       RETURNING *`,
      [quantity, userId, productId]
    );
    return result.rows[0] || null;
  }

  // Remove a single item
  static async removeItem(userId, productId) {
    const result = await pool.query(
      `DELETE FROM cart WHERE user_id = $1 AND product_id = $2
       RETURNING cart_id`,
      [userId, productId]
    );
    return result.rows[0] || null;
  }

  // Clear all items for a user
  static async clearCart(userId) {
    await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
  }
}

module.exports = CartModel;

const pool = require('../config/db');

class OrderModel {
  static async createOrder({ userId, items, shippingAddress, paymentMethod, total }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert order with individual address columns
      const orderResult = await client.query(
        `INSERT INTO orders (
           order_id, user_id, order_status, total_price,
           full_name, email, phone, address_line, city, state, zip, country,
           shipping_address, payment_status, created_at, updated_at
         )
         VALUES (
           gen_random_uuid(), $1, 'pending', $2,
           $3, $4, $5, $6, $7, $8, $9, $10,
           $11, $12, NOW(), NOW()
         )
         RETURNING *`,
        [
          userId,
          total,
          shippingAddress.fullName,
          shippingAddress.email,
          shippingAddress.phone,
          shippingAddress.address,
          shippingAddress.city,
          shippingAddress.state,
          shippingAddress.zip,
          shippingAddress.country,
          `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}, ${shippingAddress.country}`,
          paymentMethod === 'cod' ? 'pending' : 'paid'
        ]
      );
      const order = orderResult.rows[0];

      // 2. Insert order_items + decrement stock
      for (const item of items) {
        const subtotalItem = parseFloat(item.price) * item.quantity;
        await client.query(
          `INSERT INTO order_items (order_item_id, order_id, product_id, quantity, price_per_unit, subtotal)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
          [order.order_id, item.product_id, item.quantity, parseFloat(item.price), subtotalItem]
        );

        // Decrement stock — prevent going below 0
        await client.query(
          `UPDATE products
           SET stock_quantity = GREATEST(stock_quantity - $1, 0), updated_at = NOW()
           WHERE product_id = $2`,
          [item.quantity, item.product_id]
        );
      }

      // 3. Insert payment record
      await client.query(
        `INSERT INTO payments (payment_id, order_id, payment_method, amount, payment_status, payment_date, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), NOW())`,
        [order.order_id, paymentMethod, total, paymentMethod === 'cod' ? 'pending' : 'paid']
      );

      // 4. Clear user's cart
      await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

      await client.query('COMMIT');
      return order;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async getOrdersByUser(userId) {
    const result = await pool.query(
      `SELECT o.order_id, o.order_status, o.total_price, o.payment_status,
              o.full_name, o.city, o.country, o.created_at,
              p.payment_method,
              COUNT(oi.order_item_id) as item_count
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.order_id
       LEFT JOIN order_items oi ON oi.order_id = o.order_id
       WHERE o.user_id = $1
       GROUP BY o.order_id, p.payment_method
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async getOrderById(orderId, userId) {
    const order = await pool.query(
      `SELECT o.order_id, o.order_status, o.total_price, o.payment_status,
              o.full_name, o.email, o.phone, o.address_line, o.city, o.state, o.zip, o.country,
              o.created_at, o.updated_at,
              p.payment_method
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.order_id
       WHERE o.order_id = $1 AND o.user_id = $2`,
      [orderId, userId]
    );
    if (!order.rows[0]) return null;

    const items = await pool.query(
      `SELECT oi.quantity, oi.price_per_unit, oi.subtotal,
              pr.name, pr.image_url, pr.brand, pr.product_id
       FROM order_items oi
       JOIN products pr ON pr.product_id = oi.product_id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    return { ...order.rows[0], items: items.rows };
  }
}

module.exports = OrderModel;

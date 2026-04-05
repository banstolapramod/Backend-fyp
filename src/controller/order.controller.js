const OrderModel = require('../model/orderModel');
const CartModel = require('../model/cartModel');

// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress?.fullName || !shippingAddress?.address || !shippingAddress?.city || !shippingAddress?.phone) {
      return res.status(400).json({ success: false, error: 'Complete shipping address is required' });
    }

    if (!['cod', 'card'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, error: 'Payment method must be cod or card' });
    }

    // Get current cart items
    const items = await CartModel.getCartItems(req.user.id);
    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
    const shipping = subtotal > 100 ? 0 : 15;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    const order = await OrderModel.createOrder({
      userId: req.user.id,
      items,
      shippingAddress,
      paymentMethod,
      total
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: {
        order_id: order.order_id,
        order_status: order.order_status,
        total_price: order.total_price,
        payment_status: order.payment_status,
        created_at: order.created_at
      }
    });
  } catch (err) {
    console.error('CREATE ORDER ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to place order', details: err.message });
  }
};

// GET /api/orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await OrderModel.getOrdersByUser(req.user.id);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch orders', details: err.message });
  }
};

// GET /api/orders/vendor/customers — unique customers who ordered vendor's products
exports.getVendorCustomers = async (req, res) => {
  try {
    const pool = require('../config/db');
    const result = await pool.query(
      `SELECT
         u.user_id, u.name, u.email, u.created_at as member_since,
         COUNT(DISTINCT o.order_id) as total_orders,
         SUM(oi.subtotal) as total_spent,
         MAX(o.created_at) as last_order_date
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.order_id
       JOIN products pr ON pr.product_id = oi.product_id
       JOIN users u ON u.user_id = o.user_id
       WHERE pr.vendor_id = $1
       GROUP BY u.user_id, u.name, u.email, u.created_at
       ORDER BY total_orders DESC`,
      [req.user.id]
    );
    res.json({ success: true, customers: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch customers', details: err.message });
  }
};

// GET /api/orders/vendor/customers/:userId — customer detail with their orders
exports.getVendorCustomerDetail = async (req, res) => {
  try {
    const pool = require('../config/db');

    const customer = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.created_at as member_since
       FROM users u WHERE u.user_id = $1`,
      [req.params.userId]
    );
    if (!customer.rows[0]) return res.status(404).json({ success: false, error: 'Customer not found' });

    const orders = await pool.query(
      `SELECT DISTINCT
         o.order_id, o.order_status, o.payment_status, o.total_price,
         o.created_at, p.payment_method
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.order_id
       JOIN products pr ON pr.product_id = oi.product_id
       LEFT JOIN payments p ON p.order_id = o.order_id
       WHERE o.user_id = $1 AND pr.vendor_id = $2
       ORDER BY o.created_at DESC`,
      [req.params.userId, req.user.id]
    );

    res.json({ success: true, customer: customer.rows[0], orders: orders.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch customer detail', details: err.message });
  }
};
exports.getVendorOrders = async (req, res) => {
  try {
    const pool = require('../config/db');
    const result = await pool.query(
      `SELECT DISTINCT
         o.order_id, o.order_status, o.total_price, o.payment_status,
         o.full_name, o.email, o.phone, o.address_line, o.city, o.state, o.zip, o.country,
         o.created_at,
         p.payment_method,
         u.name as customer_name, u.email as customer_email
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.order_id
       JOIN products pr ON pr.product_id = oi.product_id
       JOIN users u ON u.user_id = o.user_id
       LEFT JOIN payments p ON p.order_id = o.order_id
       WHERE pr.vendor_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch vendor orders', details: err.message });
  }
};

// GET /api/orders/vendor/:orderId — full order detail for vendor
exports.getVendorOrderById = async (req, res) => {
  try {
    const pool = require('../config/db');
    const order = await pool.query(
      `SELECT o.*, p.payment_method, u.name as customer_name, u.email as customer_email
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.order_id
       JOIN products pr ON pr.product_id = oi.product_id
       JOIN users u ON u.user_id = o.user_id
       LEFT JOIN payments p ON p.order_id = o.order_id
       WHERE o.order_id = $1 AND pr.vendor_id = $2
       LIMIT 1`,
      [req.params.orderId, req.user.id]
    );
    if (!order.rows[0]) return res.status(404).json({ success: false, error: 'Order not found' });

    const items = await pool.query(
      `SELECT oi.quantity, oi.price_per_unit, oi.subtotal,
              pr.name, pr.image_url, pr.brand, pr.product_id, pr.stock_quantity
       FROM order_items oi
       JOIN products pr ON pr.product_id = oi.product_id
       WHERE oi.order_id = $1`,
      [req.params.orderId]
    );
    res.json({ success: true, order: { ...order.rows[0], items: items.rows } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch order', details: err.message });
  }
};

// PATCH /api/orders/vendor/:orderId/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `Status must be one of: ${allowed.join(', ')}` });
    }

    const pool = require('../config/db');
    const check = await pool.query(
      `SELECT 1 FROM order_items oi
       JOIN products pr ON pr.product_id = oi.product_id
       WHERE oi.order_id = $1 AND pr.vendor_id = $2 LIMIT 1`,
      [req.params.orderId, req.user.id]
    );
    if (!check.rows[0]) return res.status(403).json({ success: false, error: 'Access denied' });

    const result = await pool.query(
      `UPDATE orders SET order_status = $1, updated_at = NOW()
       WHERE order_id = $2 RETURNING order_id, order_status`,
      [status, req.params.orderId]
    );
    res.json({ success: true, message: `Order status updated to ${status}`, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update order status', details: err.message });
  }
};

// PATCH /api/orders/vendor/:orderId/payment-status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { payment_status } = req.body;
    const allowed = ['pending', 'paid', 'failed'];
    if (!allowed.includes(payment_status)) {
      return res.status(400).json({ success: false, error: `Payment status must be one of: ${allowed.join(', ')}` });
    }

    const pool = require('../config/db');
    const check = await pool.query(
      `SELECT 1 FROM order_items oi
       JOIN products pr ON pr.product_id = oi.product_id
       WHERE oi.order_id = $1 AND pr.vendor_id = $2 LIMIT 1`,
      [req.params.orderId, req.user.id]
    );
    if (!check.rows[0]) return res.status(403).json({ success: false, error: 'Access denied' });

    // Update both orders and payments tables
    await pool.query(
      `UPDATE orders SET payment_status = $1, updated_at = NOW() WHERE order_id = $2`,
      [payment_status, req.params.orderId]
    );
    await pool.query(
      `UPDATE payments SET payment_status = $1, updated_at = NOW() WHERE order_id = $2`,
      [payment_status, req.params.orderId]
    );

    res.json({ success: true, message: `Payment status updated to ${payment_status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update payment status', details: err.message });
  }
};

// GET /api/orders/:orderId
exports.getOrderById = async (req, res) => {
  try {
    const order = await OrderModel.getOrderById(req.params.orderId, req.user.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch order', details: err.message });
  }
};

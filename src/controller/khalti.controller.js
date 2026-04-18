const pool = require('../config/db');
const CartModel = require('../model/cartModel');
const OrderModel = require('../model/orderModel');

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_BASE_URL = process.env.KHALTI_BASE_URL || 'https://dev.khalti.com/api/v2';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// POST /api/khalti/initiate
// Initiates Khalti payment — stores pending order data in DB, returns Khalti payment_url
exports.initiatePayment = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress?.fullName || !shippingAddress?.address || !shippingAddress?.city || !shippingAddress?.phone) {
      return res.status(400).json({ success: false, error: 'Complete shipping address is required' });
    }

    // Get cart items
    const items = await CartModel.getCartItems(req.user.id);
    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
    const shipping = subtotal > 100 ? 0 : 15;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    // Amount in paisa (1 NPR = 100 paisa)
    const amountPaisa = Math.round(total * 100);

    // Store pending order in DB so we can create it after verification
    const pendingResult = await pool.query(
      `INSERT INTO pending_khalti_orders
         (user_id, shipping_address, items_snapshot, total_amount, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [
        req.user.id,
        JSON.stringify(shippingAddress),
        JSON.stringify(items),
        total
      ]
    );
    const pendingOrderId = pendingResult.rows[0].id;

    // Call Khalti initiate API
    const khaltiRes = await fetch(`${KHALTI_BASE_URL}/epayment/initiate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        return_url: `${FRONTEND_URL}/payment/verify`,
        website_url: FRONTEND_URL,
        amount: amountPaisa,
        purchase_order_id: String(pendingOrderId),
        purchase_order_name: `SneakersSpot Order #${pendingOrderId}`,
        customer_info: {
          name: shippingAddress.fullName,
          email: shippingAddress.email || req.user.email,
          phone: shippingAddress.phone
        }
      })
    });

    const khaltiData = await khaltiRes.json();

    if (!khaltiRes.ok || !khaltiData.payment_url) {
      console.error('Khalti initiate error:', khaltiData);
      return res.status(502).json({
        success: false,
        error: khaltiData.detail || 'Failed to initiate Khalti payment'
      });
    }

    res.json({
      success: true,
      payment_url: khaltiData.payment_url,
      pidx: khaltiData.pidx,
      pending_order_id: pendingOrderId
    });

  } catch (err) {
    console.error('KHALTI INITIATE ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to initiate payment', details: err.message });
  }
};

// POST /api/khalti/verify
// Called after Khalti redirects back — verifies payment and creates the order
exports.verifyPayment = async (req, res) => {
  try {
    const { pidx, purchase_order_id } = req.body;

    if (!pidx || !purchase_order_id) {
      return res.status(400).json({ success: false, error: 'pidx and purchase_order_id are required' });
    }

    // Verify with Khalti
    const khaltiRes = await fetch(`${KHALTI_BASE_URL}/epayment/lookup/`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pidx })
    });

    const khaltiData = await khaltiRes.json();
    console.log('Khalti lookup response:', khaltiData);

    if (!khaltiRes.ok || khaltiData.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        error: `Payment not completed. Status: ${khaltiData.status || 'unknown'}`,
        khalti_status: khaltiData.status
      });
    }

    // Fetch pending order data
    const pendingResult = await pool.query(
      `SELECT * FROM pending_khalti_orders WHERE id = $1 AND user_id = $2`,
      [purchase_order_id, req.user.id]
    );

    if (!pendingResult.rows[0]) {
      return res.status(404).json({ success: false, error: 'Pending order not found' });
    }

    const pending = pendingResult.rows[0];

    // Check not already processed
    if (pending.processed) {
      return res.status(409).json({ success: false, error: 'Payment already processed' });
    }

    const shippingAddress = pending.shipping_address;
    const items = pending.items_snapshot;
    const total = parseFloat(pending.total_amount);

    // Create the actual order
    const order = await OrderModel.createOrder({
      userId: req.user.id,
      items,
      shippingAddress,
      paymentMethod: 'khalti',
      total
    });

    // Mark payment as paid
    await pool.query(
      `UPDATE orders SET payment_status = 'paid', updated_at = NOW() WHERE order_id = $1`,
      [order.order_id]
    );
    await pool.query(
      `UPDATE payments SET payment_status = 'paid', updated_at = NOW() WHERE order_id = $1`,
      [order.order_id]
    );

    // Mark pending order as processed
    await pool.query(
      `UPDATE pending_khalti_orders SET processed = true, order_id = $1 WHERE id = $2`,
      [order.order_id, purchase_order_id]
    );

    res.json({
      success: true,
      message: 'Payment verified and order placed successfully',
      order: {
        order_id: order.order_id,
        total_price: order.total_price,
        payment_status: 'paid',
        order_status: order.order_status
      }
    });

  } catch (err) {
    console.error('KHALTI VERIFY ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to verify payment', details: err.message });
  }
};

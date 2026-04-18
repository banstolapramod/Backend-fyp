const Stripe = require('stripe');
const pool = require('../config/db');
const CartModel = require('../model/cartModel');
const OrderModel = require('../model/orderModel');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// POST /api/stripe/create-payment-intent
// Creates a Stripe PaymentIntent and returns the client_secret to the frontend
exports.createPaymentIntent = async (req, res) => {
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
    const shippingCost = subtotal > 100 ? 0 : 15;
    const tax = subtotal * 0.08;
    const total = subtotal + shippingCost + tax;

    // Stripe amount is in cents (USD)
    const amountCents = Math.round(total * 100);

    // Store pending order so we can create it after payment confirmation
    const pendingResult = await pool.query(
      `INSERT INTO pending_stripe_orders
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

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: {
        pending_order_id: String(pendingOrderId),
        user_id: req.user.id
      },
      description: `SneakersSpot Order #${pendingOrderId}`
    });

    res.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      pending_order_id: pendingOrderId,
      amount: total
    });

  } catch (err) {
    console.error('STRIPE CREATE PAYMENT INTENT ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to create payment intent', details: err.message });
  }
};

// POST /api/stripe/confirm-order
// Called after Stripe payment succeeds on frontend — creates the actual order
exports.confirmOrder = async (req, res) => {
  try {
    const { payment_intent_id, pending_order_id } = req.body;

    if (!payment_intent_id || !pending_order_id) {
      return res.status(400).json({ success: false, error: 'payment_intent_id and pending_order_id are required' });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: `Payment not completed. Status: ${paymentIntent.status}`
      });
    }

    // Fetch pending order
    const pendingResult = await pool.query(
      `SELECT * FROM pending_stripe_orders WHERE id = $1 AND user_id = $2`,
      [pending_order_id, req.user.id]
    );

    if (!pendingResult.rows[0]) {
      return res.status(404).json({ success: false, error: 'Pending order not found' });
    }

    const pending = pendingResult.rows[0];

    if (pending.processed) {
      return res.status(409).json({ success: false, error: 'Order already processed' });
    }

    const shippingAddress = pending.shipping_address;
    const items = pending.items_snapshot;
    const total = parseFloat(pending.total_amount);

    // Create the actual order
    const order = await OrderModel.createOrder({
      userId: req.user.id,
      items,
      shippingAddress,
      paymentMethod: 'card',
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

    // Mark pending as processed
    await pool.query(
      `UPDATE pending_stripe_orders SET processed = true, order_id = $1 WHERE id = $2`,
      [order.order_id, pending_order_id]
    );

    res.json({
      success: true,
      message: 'Payment confirmed and order placed successfully',
      order: {
        order_id: order.order_id,
        total_price: order.total_price,
        payment_status: 'paid',
        order_status: order.order_status
      }
    });

  } catch (err) {
    console.error('STRIPE CONFIRM ORDER ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to confirm order', details: err.message });
  }
};

// GET /api/stripe/publishable-key
// Safely exposes the publishable key to the frontend
exports.getPublishableKey = async (req, res) => {
  res.json({ publishable_key: process.env.STRIPE_PUBLISHABLE_KEY });
};

const CartModel = require('../model/cartModel');

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const items = await CartModel.getCartItems(req.user.id);
    const total = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
    res.json({ success: true, items, total: total.toFixed(2), count: items.length });
  } catch (err) {
    console.error('GET CART ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch cart', details: err.message });
  }
};

// POST /api/cart/add
exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ success: false, error: 'product_id is required' });
    if (quantity < 1) return res.status(400).json({ success: false, error: 'quantity must be at least 1' });

    // Check stock
    const pool = require('../config/db');
    const stock = await pool.query('SELECT stock_quantity FROM products WHERE product_id = $1 AND is_active = true', [product_id]);
    if (!stock.rows[0]) return res.status(404).json({ success: false, error: 'Product not found' });

    // Check existing cart qty + new qty doesn't exceed stock
    const existing = await pool.query(
      'SELECT quantity FROM cart WHERE user_id = $1 AND product_id = $2',
      [req.user.id, product_id]
    );
    const currentQty = existing.rows[0]?.quantity || 0;
    if (currentQty + parseInt(quantity) > stock.rows[0].stock_quantity) {
      return res.status(400).json({ success: false, error: `Only ${stock.rows[0].stock_quantity - currentQty} more units available` });
    }

    const item = await CartModel.addItem(req.user.id, product_id, parseInt(quantity));
    res.status(201).json({ success: true, message: 'Item added to cart', item });
  } catch (err) {
    console.error('ADD TO CART ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to add to cart', details: err.message });
  }
};

// PUT /api/cart/update
exports.updateCartItem = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id || quantity === undefined) return res.status(400).json({ success: false, error: 'product_id and quantity required' });

    if (parseInt(quantity) <= 0) {
      await CartModel.removeItem(req.user.id, product_id);
      return res.json({ success: true, message: 'Item removed from cart' });
    }

    // Check stock limit
    const pool = require('../config/db');
    const stock = await pool.query('SELECT stock_quantity FROM products WHERE product_id = $1', [product_id]);
    if (stock.rows[0] && parseInt(quantity) > stock.rows[0].stock_quantity) {
      return res.status(400).json({ success: false, error: `Only ${stock.rows[0].stock_quantity} units available` });
    }

    const item = await CartModel.updateItem(req.user.id, product_id, parseInt(quantity));
    if (!item) return res.status(404).json({ success: false, error: 'Cart item not found' });
    res.json({ success: true, message: 'Cart updated', item });
  } catch (err) {
    console.error('UPDATE CART ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to update cart', details: err.message });
  }
};

// DELETE /api/cart/remove/:productId
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const removed = await CartModel.removeItem(req.user.id, productId);
    if (!removed) return res.status(404).json({ success: false, error: 'Item not found in cart' });
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    console.error('REMOVE FROM CART ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to remove item', details: err.message });
  }
};

// DELETE /api/cart/clear
exports.clearCart = async (req, res) => {
  try {
    await CartModel.clearCart(req.user.id);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    console.error('CLEAR CART ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to clear cart', details: err.message });
  }
};

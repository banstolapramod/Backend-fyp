"use strict";

const { CartItem, sequelize } = require("../models");

/**
 * Add item to cart (UPSERT)
 * If product already exists in cart → increase quantity
 */
exports.addCartItem = async (req, res) => {
  const { cart_id, product_id, quantity } = req.body;

  const t = await sequelize.transaction();
  try {
    const [item, created] = await CartItem.findOrCreate({
      where: { cart_id, product_id },
      defaults: { quantity },
      transaction: t,
    });

    if (!created) {
      item.quantity += quantity;
      await item.save({ transaction: t });
    }

    await t.commit();
    res.status(201).json(item);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get all cart items by cart_id
 */
exports.getCartItems = async (req, res) => {
  try {
    const items = await CartItem.findAll({
      where: { cart_id: req.params.cartId },
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update cart item quantity
 */
exports.updateCartItem = async (req, res) => {
  const { quantity } = req.body;

  try {
    const item = await CartItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    item.quantity = quantity;
    await item.save();

    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Remove single cart item
 */
exports.removeCartItem = async (req, res) => {
  try {
    const deleted = await CartItem.destroy({
      where: { cart_item_id: req.params.id },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json({ message: "Cart item removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Clear cart (delete all items)
 */
exports.clearCart = async (req, res) => {
  try {
    await CartItem.destroy({
      where: { cart_id: req.params.cartId },
    });

    res.json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

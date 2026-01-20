const { Order, OrderItem, Cart, sequelize } = require("../models");

exports.createOrder = async (req, res) => {
  const { user_id, shipping_address } = req.body;

  const t = await sequelize.transaction();
  try {
    const cartItems = await Cart.findAll({ where: { user_id } });

    if (!cartItems.length)
      return res.status(400).json({ error: "Cart is empty" });

    const total_price = cartItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const order = await Order.create(
      {
        user_id,
        shipping_address,
        total_price,
        order_status: "pending",
        payment_status: "pending",
      },
      { transaction: t }
    );

    for (const item of cartItems) {
      await OrderItem.create(
        {
          order_id: order.order_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_per_unit: item.price,
          subtotal: item.quantity * item.price,
        },
        { transaction: t }
      );
    }

    await Cart.destroy({ where: { user_id }, transaction: t });

    await t.commit();
    res.status(201).json(order);
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
};

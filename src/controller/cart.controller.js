const { Cart, sequelize } = require("../models");

exports.addToCart = async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  const t = await sequelize.transaction();
  try {
    const [item, created] = await Cart.findOrCreate({
      where: { user_id, product_id },
      defaults: { quantity },
      transaction: t,
    });

    if (!created) {
      item.quantity += quantity;
      await item.save({ transaction: t });
    }

    await t.commit();
    res.json(item);
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
};

exports.getCartByUser = async (req, res) => {
  const items = await Cart.findAll({
    where: { user_id: req.params.userId },
  });
  res.json(items);
};

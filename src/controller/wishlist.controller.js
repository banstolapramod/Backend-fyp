const { Wishlist } = require("../models");

exports.addToWishlist = async (req, res) => {
  try {
    const item = await Wishlist.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(409).json({ error: "Already in wishlist" });
  }
};

exports.getWishlist = async (req, res) => {
  const items = await Wishlist.findAll({
    where: { user_id: req.params.userId },
  });
  res.json(items);
};

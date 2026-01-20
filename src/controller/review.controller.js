const { Review } = require("../models");

exports.addReview = async (req, res) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getReviewsByProduct = async (req, res) => {
  const reviews = await Review.findAll({
    where: { product_id: req.params.productId },
  });
  res.json(reviews);
};

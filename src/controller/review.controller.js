const pool = require('../config/db');

// GET /api/reviews/:productId — public
exports.getProductReviews = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.review_id, r.rating, r.comment, r.created_at,
              u.name as user_name, u.user_id
       FROM reviews r
       JOIN users u ON u.user_id = r.user_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.productId]
    );

    const stats = await pool.query(
      `SELECT
         COUNT(*) as total,
         ROUND(AVG(rating), 1) as average,
         COUNT(CASE WHEN rating = 5 THEN 1 END) as five,
         COUNT(CASE WHEN rating = 4 THEN 1 END) as four,
         COUNT(CASE WHEN rating = 3 THEN 1 END) as three,
         COUNT(CASE WHEN rating = 2 THEN 1 END) as two,
         COUNT(CASE WHEN rating = 1 THEN 1 END) as one
       FROM reviews WHERE product_id = $1`,
      [req.params.productId]
    );

    res.json({ success: true, reviews: result.rows, stats: stats.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch reviews', details: err.message });
  }
};

// POST /api/reviews/:productId — authenticated
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { productId } = req.params;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    }

    // Check if user already reviewed this product
    const existing = await pool.query(
      'SELECT review_id FROM reviews WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );
    if (existing.rows[0]) {
      return res.status(409).json({ success: false, error: 'You have already reviewed this product' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (review_id, user_id, product_id, rating, comment, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [req.user.id, productId, parseInt(rating), comment?.trim() || null]
    );

    // Fetch with user name
    const review = await pool.query(
      `SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON u.user_id = r.user_id WHERE r.review_id = $1`,
      [result.rows[0].review_id]
    );

    res.status(201).json({ success: true, message: 'Review submitted', review: review.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to submit review', details: err.message });
  }
};

// DELETE /api/reviews/:reviewId — owner only
exports.deleteReview = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM reviews WHERE review_id = $1 AND user_id = $2 RETURNING review_id',
      [req.params.reviewId, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Review not found or not yours' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete review', details: err.message });
  }
};

// GET /api/reviews/admin/all — admin only
exports.getAllReviewsAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin only' });
    const result = await pool.query(
      `SELECT r.review_id, r.rating, r.comment, r.created_at,
              u.name as user_name,
              p.name as product_name, p.product_id
       FROM reviews r
       JOIN users u ON u.user_id = r.user_id
       JOIN products p ON p.product_id = r.product_id
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, reviews: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch reviews', details: err.message });
  }
};

// DELETE /api/reviews/admin/:reviewId — admin can delete any review
exports.adminDeleteReview = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin only' });
    const result = await pool.query(
      'DELETE FROM reviews WHERE review_id = $1 RETURNING review_id',
      [req.params.reviewId]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete review', details: err.message });
  }
};

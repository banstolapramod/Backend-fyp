const express = require('express');
const reviewController = require('../controller/review.controller');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public
router.get('/:productId', reviewController.getProductReviews);

// Protected
router.post('/:productId', authMiddleware, reviewController.createReview);
router.delete('/:reviewId', authMiddleware, reviewController.deleteReview);

module.exports = router;

const express = require('express');
const stripeController = require('../controller/stripe.controller');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public — frontend needs publishable key on load
router.get('/publishable-key', stripeController.getPublishableKey);

// Protected
router.use(authMiddleware);
router.post('/create-payment-intent', stripeController.createPaymentIntent);
router.post('/confirm-order', stripeController.confirmOrder);

module.exports = router;

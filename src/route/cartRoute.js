const express = require('express');
const cartController = require('../controller/cart.controller');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All cart routes require authentication
router.use(authMiddleware);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/update', cartController.updateCartItem);
router.delete('/remove/:productId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);

module.exports = router;

const express = require('express');
const wishlistController = require('../controller/wishlist.controller');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', wishlistController.getWishlist);
router.post('/toggle', wishlistController.toggleWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);

module.exports = router;

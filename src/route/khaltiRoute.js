const express = require('express');
const khaltiController = require('../controller/khalti.controller');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.post('/initiate', khaltiController.initiatePayment);
router.post('/verify', khaltiController.verifyPayment);

module.exports = router;

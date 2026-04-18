const express = require('express');
const payoutController = require('../controller/payout.controller');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

// Admin routes
router.get('/admin/summary', payoutController.getAdminPayoutSummary);
router.get('/admin/vendor/:vendorId', payoutController.getVendorPayoutHistory);
router.post('/admin/pay/:vendorId', payoutController.recordPayout);

// Vendor routes
router.get('/vendor/earnings', payoutController.getMyEarnings);

module.exports = router;

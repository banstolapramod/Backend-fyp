const express = require('express');
const orderController = require('../controller/order.controller');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.post('/', orderController.createOrder);
router.get('/', orderController.getMyOrders);
router.get('/vendor', orderController.getVendorOrders);
router.get('/vendor/customers', orderController.getVendorCustomers);
router.get('/vendor/customers/:userId', orderController.getVendorCustomerDetail);
router.get('/vendor/:orderId', orderController.getVendorOrderById);
router.patch('/vendor/:orderId/status', orderController.updateOrderStatus);
router.patch('/vendor/:orderId/payment-status', orderController.updatePaymentStatus);
router.get('/:orderId', orderController.getOrderById);

module.exports = router;

const express = require("express");
const productController = require("../controller/product.controller");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadProductImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public routes (no authentication required)
router.get("/public", productController.getAllProducts);
router.get("/public/:productId", productController.getProductById);
router.get("/vendor-profile/:vendorId", productController.getVendorProfile);
router.get("/test", (req, res) => {
  res.json({ message: "Product routes are working!", timestamp: new Date().toISOString() });
});

// Protected routes (authentication required)
router.use(authMiddleware);

// Vendor routes
router.post("/", uploadProductImage, productController.createProduct);
router.get("/vendor", productController.getVendorProducts);
router.get("/vendor/stats", productController.getVendorStats);
router.get("/db-test", async (req, res) => {
  try {
    const { query } = require('../config/db');
    const result = await query('SELECT COUNT(*) as user_count FROM users');
    const productResult = await query('SELECT COUNT(*) as product_count FROM products');
    res.json({ 
      message: "Database connection working!",
      user_count: result.rows[0].user_count,
      product_count: productResult.rows[0].product_count,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ error: "Database connection failed", details: error.message });
  }
});
router.get("/:productId", productController.getProductById);
router.put("/:productId", uploadProductImage, productController.updateProduct);
router.delete("/:productId", productController.deleteProduct);
router.patch("/:productId/stock", productController.updateStock);

module.exports = router;
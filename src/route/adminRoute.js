const express = require("express");
const adminController = require("../controller/admin.controller");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  console.log("🔍 isAdmin middleware - req.user:", req.user);
  
  if (!req.user || req.user.role !== 'admin') {
    console.log("❌ isAdmin check failed - User role:", req.user?.role);
    return res.status(403).json({
      error: "Access denied. Admin only.",
    });
  }
  
  console.log("✅ isAdmin check passed for:", req.user.email);
  next();
};

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(isAdmin);

// Vendor management routes
router.get("/vendors", adminController.getAllVendors);
router.put("/vendors/:vendorId/status", adminController.updateVendorStatus);

// User management routes
router.get("/users", adminController.getAllUsers);
router.get("/users/:userId", adminController.getUserById);
router.patch("/users/:userId", adminController.updateUser);
router.delete("/users/:userId", adminController.deleteUser);

// Dashboard routes
router.get("/stats", adminController.getDashboardStats);

module.exports = router;

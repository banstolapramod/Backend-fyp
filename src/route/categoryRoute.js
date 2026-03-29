const express = require("express");
const categoryController = require("../controller/category.controller");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes (no authentication required)
router.get("/public", categoryController.getActiveCategories);
router.get("/all", categoryController.getAllCategoriesPublic);
router.get("/test", (req, res) => {
  res.json({ message: "Category routes are working!", timestamp: new Date().toISOString() });
});

// Protected routes (authentication required)
router.use(authMiddleware);

// Admin routes
router.post("/", categoryController.createCategory);
router.get("/", categoryController.getAllCategories);
router.get("/stats", categoryController.getCategoryStats);
router.get("/:categoryId", categoryController.getCategoryById);
router.put("/:categoryId", categoryController.updateCategory);
router.delete("/:categoryId", categoryController.deleteCategory);

module.exports = router;
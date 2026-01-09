const express = require("express");
const authController = require("../controller/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

// 🔒 Protected example route
router.get("/me", authMiddleware, authController.getProfile);


router.put("/profile", authMiddleware, authController.updateProfile);
router.put("/change-password", authMiddleware, authController.changePassword);


module.exports = router;
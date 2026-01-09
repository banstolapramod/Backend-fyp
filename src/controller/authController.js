const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../model/userModel");

/* REGISTER */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1️⃣ Missing fields
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // 3️⃣ Password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    // 4️⃣ Existing user
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: "Email already exists",
      });
    }

    // 5️⃣ Hashing error (rare but possible)
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch {
      return res.status(500).json({
        error: "Failed to secure password",
      });
    }

    // 6️⃣ Database insert error
    let user;
    try {
      user = await UserModel.create(name, email, hashedPassword);
    } catch {
      return res.status(500).json({
        error: "Database error while creating user",
      });
    }

    // 7️⃣ Success
    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};


/* LOGIN */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Missing fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // 2️⃣ Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // 3️ Password mismatch
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // 4️⃣ JWT secret missing
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: "JWT configuration error",
      });
    }

    // 5️ Token generation failure
    let token;
    try {
      token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
    } catch {
      return res.status(500).json({
        error: "Failed to generate authentication token",
      });
    }

    // 6️⃣ Success
    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};



exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: "Name and email are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    const updatedUser = await UserModel.updateProfile(
      userId,
      name,
      email
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({
      error: "Failed to update profile",
    });
  }
};




exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters",
      });
    }

    const user = await UserModel.findById(userId);
    const fullUser = await UserModel.findByEmail(user.email);

    const isMatch = await bcrypt.compare(
      currentPassword,
      fullUser.password
    );

    if (!isMatch) {
      return res.status(401).json({
        error: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(userId, hashedPassword);

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({
      error: "Failed to change password",
    });
  }
};



exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({
      error: "Failed to fetch user profile",
    });
  }
};
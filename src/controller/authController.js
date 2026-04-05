const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../model/userModel");

/* REGISTER */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'customer' } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    if (!['customer', 'vendor'].includes(role))
      return res.status(400).json({ error: "Invalid role. Must be 'customer' or 'vendor'" });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: "Invalid email format" });

    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existing = await UserModel.findByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create(name, email, hashedPassword, role);

    const message = role === 'vendor'
      ? "Vendor account created! Please wait for admin approval."
      : "User registered successfully";

    res.status(201).json({
      message,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, vendor_status: user.vendor_status }
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* LOGIN */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await UserModel.findByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

    if (!process.env.JWT_SECRET)
      return res.status(500).json({ error: "JWT configuration error" });

    if (user.role === 'vendor' && user.vendor_status !== 'approved') {
      return res.status(403).json({
        error: "Your vendor account is pending approval. Please wait for admin approval."
      });
    }

    const token = jwt.sign(
      { id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendor_status: user.vendor_status
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* UPDATE PROFILE */
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email)
      return res.status(400).json({ error: "Name and email are required" });

    const updated = await UserModel.updateProfile(req.user.id, name, email);
    res.status(200).json({ message: "Profile updated successfully", user: updated });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

/* CHANGE PASSWORD */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Current and new password are required" });

    if (newPassword.length < 6)
      return res.status(400).json({ error: "New password must be at least 6 characters" });

    const user = await UserModel.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(req.user.id, hashed);
    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
};

/* GET PROFILE */
exports.getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ id: user.user_id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

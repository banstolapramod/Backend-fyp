const jwt = require("jsonwebtoken");
const UserModel = require("../model/userModel");

module.exports = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader)
    return res.status(401).json({ error: "No token provided" });

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data from DB to get role and vendor_status
    let user;
    try {
      user = await UserModel.findById(decoded.id);
    } catch (dbErr) {
      // Invalid ID format (e.g. old integer token against UUID column)
      return res.status(401).json({ error: "Invalid token — please log in again" });
    }

    if (!user) {
      return res.status(401).json({ error: "User not found — please log in again" });
    }

    req.user = {
      id: user.user_id,
      email: user.email,
      role: user.role,
      vendor_status: user.vendor_status
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

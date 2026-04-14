const UserModel = require("../model/userModel");

/* GET ALL VENDORS */
exports.getAllVendors = async (req, res) => {
  try {
    console.log("🔍 getAllVendors - req.user:", req.user);
    
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      console.log("❌ Access denied - User:", req.user ? { role: req.user.role, email: req.user.email } : 'null');
      return res.status(403).json({
        error: "Access denied. Admin only.",
      });
    }

    const { limit = 100, offset = 0 } = req.query;
    
    const vendors = await UserModel.findAllVendors(
      parseInt(limit),
      parseInt(offset)
    );

    console.log(`✅ Admin ${req.user.email} fetched ${vendors.length} vendors`);

    res.status(200).json({
      vendors,
      count: vendors.length
    });
  } catch (err) {
    console.error("GET ALL VENDORS ERROR:", err);
    res.status(500).json({
      error: "Failed to fetch vendors",
    });
  }
};

/* UPDATE VENDOR STATUS */
exports.updateVendorStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      console.log("❌ Access denied - User:", req.user ? { role: req.user.role, email: req.user.email } : 'null');
      return res.status(403).json({
        error: "Access denied. Admin only.",
      });
    }

    const { vendorId } = req.params;
    const { status } = req.body;

    console.log("🔍 updateVendorStatus - vendorId:", vendorId, "type:", typeof vendorId);
    console.log("🔍 updateVendorStatus - status:", status);

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be 'pending', 'approved', or 'rejected'",
      });
    }

    // Validate vendorId exists
    if (!vendorId) {
      return res.status(400).json({
        error: "Vendor ID is required",
      });
    }

    // Try to update the vendor - let the database handle the ID format
    const updatedVendor = await UserModel.updateVendorStatus(vendorId, status);

    if (!updatedVendor) {
      console.log("❌ Vendor not found for ID:", vendorId);
      return res.status(404).json({
        error: "Vendor not found",
      });
    }

    console.log(`✅ Admin ${req.user.email} updated vendor ${vendorId} status to ${status}`);

    res.status(200).json({
      message: `Vendor status updated to ${status}`,
      vendor: updatedVendor,
    });
  } catch (err) {
    console.error("UPDATE VENDOR STATUS ERROR:", err);
    res.status(500).json({
      error: "Failed to update vendor status",
      details: err.message
    });
  }
};

/* GET ALL USERS */
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        error: "Access denied. Admin only.",
      });
    }

    const { limit = 100, offset = 0 } = req.query;
    
    const users = await UserModel.findAll(
      parseInt(limit),
      parseInt(offset)
    );

    console.log(`✅ Admin ${req.user.email} fetched ${users.length} users`);

    res.status(200).json({
      users,
      count: users.length
    });
  } catch (err) {
    console.error("GET ALL USERS ERROR:", err);
    res.status(500).json({
      error: "Failed to fetch users",
    });
  }
};

/* GET ADMIN DASHBOARD STATS */
exports.getDashboardStats = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { query } = require('../config/db');

    const [userStats, vendorPending, vendorApproved, productStats, orderStats] = await Promise.all([
      UserModel.getStats(),
      query("SELECT COUNT(*) as count FROM users WHERE role='vendor' AND vendor_status='pending' AND is_active=true"),
      query("SELECT COUNT(*) as count FROM users WHERE role='vendor' AND vendor_status='approved' AND is_active=true"),
      query("SELECT COUNT(*) as total, COALESCE(SUM(stock_quantity),0) as total_stock FROM products WHERE is_active=true"),
      query("SELECT COUNT(*) as total_orders, COALESCE(SUM(total_price),0) as total_revenue, COUNT(CASE WHEN order_status='pending' THEN 1 END) as pending_orders, COUNT(CASE WHEN order_status='delivered' THEN 1 END) as delivered_orders FROM orders"),
    ]);

    res.status(200).json({
      users: {
        total: parseInt(userStats.total_users),
        customers: parseInt(userStats.customers),
        vendors: parseInt(userStats.vendors),
        admins: parseInt(userStats.admins),
        newUsers30Days: parseInt(userStats.new_users_30_days)
      },
      vendors: {
        total: parseInt(userStats.vendors),
        pending: parseInt(vendorPending.rows[0].count),
        approved: parseInt(vendorApproved.rows[0].count)
      },
      products: {
        total: parseInt(productStats.rows[0].total),
        totalStock: parseInt(productStats.rows[0].total_stock)
      },
      orders: {
        total: parseInt(orderStats.rows[0].total_orders),
        revenue: parseFloat(orderStats.rows[0].total_revenue),
        pending: parseInt(orderStats.rows[0].pending_orders),
        delivered: parseInt(orderStats.rows[0].delivered_orders)
      }
    });
  } catch (err) {
    console.error("GET DASHBOARD STATS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};

/* DELETE USER (SOFT DELETE) */
exports.deleteUser = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        error: "Access denied. Admin only.",
      });
    }

    const { userId } = req.params;

    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        error: "Cannot delete your own account",
      });
    }

    const deletedUser = await UserModel.deleteById(parseInt(userId));

    if (!deletedUser) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    console.log(`✅ Admin ${req.user.email} deleted user ${userId}`);

    res.status(200).json({
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({
      error: "Failed to delete user",
    });
  }
};

/* UPDATE USER (name, email, role) */
exports.updateUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { userId } = req.params;
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: "Name, email, and role are required" });
    }

    if (!['customer', 'vendor', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const pool = require('../config/db');
    const result = await pool.query(
      `UPDATE users SET name=$1, email=$2, role=$3, updated_at=NOW()
       WHERE user_id=$4 AND is_active=true
       RETURNING user_id as id, name, email, role, vendor_status, updated_at`,
      [name, email, role, userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`✅ Admin ${req.user.email} updated user ${userId}`);
    res.status(200).json({ message: "User updated successfully", user: result.rows[0] });
  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
};

/* GET USER BY ID */
exports.getUserById = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        error: "Access denied. Admin only.",
      });
    }

    const { userId } = req.params;

    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    const user = await UserModel.findById(parseInt(userId));

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    console.log(`✅ Admin ${req.user.email} fetched user ${userId}`);

    res.status(200).json({
      user
    });
  } catch (err) {
    console.error("GET USER BY ID ERROR:", err);
    res.status(500).json({
      error: "Failed to fetch user",
    });
  }
};
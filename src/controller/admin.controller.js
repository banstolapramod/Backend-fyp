const UserModel = require("../model/user.model");

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
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        error: "Access denied. Admin only.",
      });
    }

    // Get user statistics
    const userStats = await UserModel.getStats();
    
    // Get vendor statistics
    const totalVendors = await UserModel.countByRole('vendor');
    
    // Import query function for custom queries
    const { query } = require('../config/db');
    
    const pendingVendors = await query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1 AND vendor_status = $2 AND is_active = true',
      ['vendor', 'pending']
    );
    const approvedVendors = await query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1 AND vendor_status = $2 AND is_active = true',
      ['vendor', 'approved']
    );

    console.log(`✅ Admin ${req.user.email} fetched dashboard stats`);

    res.status(200).json({
      users: {
        total: parseInt(userStats.total_users),
        customers: parseInt(userStats.customers),
        vendors: parseInt(userStats.vendors),
        admins: parseInt(userStats.admins),
        newUsers30Days: parseInt(userStats.new_users_30_days)
      },
      vendors: {
        total: totalVendors,
        pending: parseInt(pendingVendors.rows[0].count),
        approved: parseInt(approvedVendors.rows[0].count)
      }
    });
  } catch (err) {
    console.error("GET DASHBOARD STATS ERROR:", err);
    res.status(500).json({
      error: "Failed to fetch dashboard statistics",
    });
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
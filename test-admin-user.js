require("dotenv").config({ path: require('path').join(__dirname, '.env') });
const UserModel = require("./src/model/user.model");

async function testAdminUser() {
  try {
    console.log("🔍 Testing admin user...");
    
    // Check if admin user exists
    const adminUser = await UserModel.findByEmail('testadmin@sneakersspot.com');
    
    if (adminUser) {
      console.log("✅ Admin user found:", {
        id: adminUser.user_id,
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name,
        is_active: adminUser.is_active
      });
    } else {
      console.log("❌ Admin user not found");
      
      // Create admin user
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash("Admin123", 10);
      
      const newAdmin = await UserModel.create({
        name: "Test Admin",
        email: "testadmin@sneakersspot.com",
        password_hash: hashedPassword,
        role: "admin"
      });
      
      console.log("✅ Admin user created:", newAdmin);
    }
    
  } catch (error) {
    console.error("❌ Error testing admin user:", error);
  }
  
  process.exit(0);
}

testAdminUser();
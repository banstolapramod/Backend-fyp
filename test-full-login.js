require("dotenv").config({ path: require('path').join(__dirname, '.env') });
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testFullLogin() {
  try {
    console.log("🔍 Testing full login flow...\n");
    
    // Test 1: Admin login
    console.log("1️⃣ Testing admin login (testadmin@sneakersspot.com)...");
    const adminEmail = "testadmin@sneakersspot.com";
    const adminPassword = "Admin123";
    
    const adminResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [adminEmail]
    );
    
    if (adminResult.rows.length === 0) {
      console.log("❌ Admin not found");
    } else {
      const admin = adminResult.rows[0];
      const isMatch = await bcrypt.compare(adminPassword, admin.password_hash);
      
      if (isMatch) {
        console.log("✅ Admin password correct");
        console.log(`   Role: ${admin.role}`);
        console.log(`   Vendor Status: ${admin.vendor_status}`);
        
        const token = jwt.sign(
          { 
            id: admin.user_id, 
            email: admin.email, 
            role: admin.role,
            vendor_status: admin.vendor_status
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        console.log(`   Token: ${token.substring(0, 50)}...`);
      } else {
        console.log("❌ Admin password incorrect");
      }
    }
    
    // Test 2: Check vendor
    console.log("\n2️⃣ Checking vendor (vendor@gmail.com)...");
    const vendorResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      ["vendor@gmail.com"]
    );
    
    if (vendorResult.rows.length > 0) {
      const vendor = vendorResult.rows[0];
      console.log("✅ Vendor found");
      console.log(`   Name: ${vendor.name}`);
      console.log(`   Role: ${vendor.role}`);
      console.log(`   Vendor Status: ${vendor.vendor_status}`);
      console.log(`   Can login: ${vendor.vendor_status === 'approved' ? 'YES' : 'NO (pending approval)'}`);
    }
    
    // Test 3: List all users with vendor_status
    console.log("\n3️⃣ All users with vendor_status:");
    const allUsers = await pool.query(
      "SELECT user_id, name, email, role, vendor_status FROM users ORDER BY created_at DESC LIMIT 5"
    );
    console.table(allUsers.rows);
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

testFullLogin();

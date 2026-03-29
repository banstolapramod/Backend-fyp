require("dotenv").config();
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testLogin() {
  try {
    console.log("🔍 Testing login functionality...\n");
    
    // Test database connection
    console.log("1️⃣ Testing database connection...");
    await pool.query("SELECT NOW()");
    console.log("✅ Database connected\n");
    
    // Check if vendor_status column exists
    console.log("2️⃣ Checking vendor_status column...");
    const columns = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'users' AND column_name = 'vendor_status'`
    );
    
    if (columns.rows.length === 0) {
      console.log("❌ vendor_status column MISSING!");
      console.log("⚠️  Run migration: node run-migration.js\n");
    } else {
      console.log("✅ vendor_status column exists\n");
    }
    
    // Check users
    console.log("3️⃣ Checking users in database...");
    const users = await pool.query(
      "SELECT user_id, name, email, role, vendor_status, is_active FROM users"
    );
    
    console.log(`Found ${users.rows.length} users:`);
    console.table(users.rows);
    
    // Test login for admin
    console.log("\n4️⃣ Testing admin login...");
    const adminEmail = "testadmin@sneakersspot.com";
    const adminPassword = "Admin123";
    
    const admin = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [adminEmail]
    );
    
    if (admin.rows.length === 0) {
      console.log(`❌ Admin user not found: ${adminEmail}`);
      console.log("⚠️  Create admin user first\n");
    } else {
      const user = admin.rows[0];
      console.log(`✅ Admin user found: ${user.name}`);
      
      // Test password
      const isMatch = await bcrypt.compare(adminPassword, user.password_hash);
      if (isMatch) {
        console.log("✅ Password matches");
        console.log(`   Role: ${user.role}`);
        console.log(`   Vendor Status: ${user.vendor_status || 'N/A'}`);
        console.log(`   Active: ${user.is_active}`);
      } else {
        console.log("❌ Password does not match");
      }
    }
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
  }
}

testLogin();

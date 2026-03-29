require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkSchema() {
  try {
    console.log("🔍 Checking users table schema...\n");
    
    // Check columns
    const columns = await pool.query(
      `SELECT column_name, data_type, column_default 
       FROM information_schema.columns 
       WHERE table_name = 'users' 
       ORDER BY ordinal_position`
    );
    
    console.log("📋 Users table columns:");
    console.table(columns.rows);
    
    // Check if vendor_status column exists
    const hasVendorStatus = columns.rows.some(col => col.column_name === 'vendor_status');
    
    if (hasVendorStatus) {
      console.log("\n✅ vendor_status column EXISTS");
      
      // Check sample users
      const users = await pool.query(
        "SELECT user_id, name, email, role, vendor_status FROM users LIMIT 5"
      );
      
      console.log("\n👥 Sample users:");
      console.table(users.rows);
    } else {
      console.log("\n❌ vendor_status column DOES NOT EXIST");
      console.log("⚠️  You need to run the migration: node run-migration.js");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();

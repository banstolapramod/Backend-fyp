require("dotenv").config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  try {
    console.log("🔄 Running database migration...");
    
    // Read the migration file
    const migrationPath = path.join(__dirname, "src", "migrations", "add-vendor-status.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log("✅ Migration completed successfully!");
    console.log("📊 Vendor status column added to users table");
    
    // Display updated users
    const result = await pool.query(
      "SELECT user_id, name, email, role, vendor_status, created_at FROM users ORDER BY created_at DESC LIMIT 10"
    );
    
    console.log("\n📋 Recent users:");
    console.table(result.rows);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

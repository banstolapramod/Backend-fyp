const path = require('path');
const dotenv = require("dotenv");

// Load .env from Backend directory
const result = dotenv.config({ path: path.join(__dirname, '.env') });

if (result.error) {
  console.error("❌ Error loading .env:", result.error);
} else {
  console.log("✅ .env loaded successfully");
  console.log("Parsed:", result.parsed);
}

console.log("\n🔍 Environment variables:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_DATABASE:", process.env.DB_DATABASE);

if (process.env.DB_PASSWORD) {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  pool.query("SELECT NOW()")
    .then(() => {
      console.log("\n✅ Database connection successful!");
      return pool.query("SELECT user_id, name, email, role FROM users LIMIT 3");
    })
    .then((result) => {
      console.log("\n👥 Sample users:");
      console.table(result.rows);
      pool.end();
    })
    .catch((err) => {
      console.log("\n❌ Database connection failed:");
      console.error(err.message);
      pool.end();
    });
}

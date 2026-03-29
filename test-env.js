require("dotenv").config();

console.log("🔍 Checking environment variables...\n");

console.log("DB_HOST:", process.env.DB_HOST, typeof process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT, typeof process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER, typeof process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD, typeof process.env.DB_PASSWORD);
console.log("DB_DATABASE:", process.env.DB_DATABASE, typeof process.env.DB_DATABASE);

console.log("\n📋 Password details:");
console.log("Length:", process.env.DB_PASSWORD?.length);
console.log("First char:", process.env.DB_PASSWORD?.[0]);
console.log("Last char:", process.env.DB_PASSWORD?.[process.env.DB_PASSWORD.length - 1]);
console.log("Has quotes:", process.env.DB_PASSWORD?.includes('"'));

// Try to create pool with explicit string conversion
const { Pool } = require('pg');

const config = {
  host: String(process.env.DB_HOST || 'localhost'),
  port: parseInt(process.env.DB_PORT || 5432),
  user: String(process.env.DB_USER || 'postgres'),
  password: String(process.env.DB_PASSWORD || ''),
  database: String(process.env.DB_DATABASE || 'SneakersSpot'),
};

console.log("\n🔧 Pool config:");
console.log(JSON.stringify(config, null, 2));

const pool = new Pool(config);

pool.query("SELECT NOW()")
  .then(() => {
    console.log("\n✅ Database connection successful!");
    pool.end();
  })
  .catch((err) => {
    console.log("\n❌ Database connection failed:");
    console.error(err.message);
    pool.end();
  });

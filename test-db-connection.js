require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Testing Database Connection...\n');

// Display current configuration
console.log('📋 Database Configuration:');
console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`   Port: ${process.env.DB_PORT || 5432}`);
console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
console.log(`   Database: ${process.env.DB_DATABASE || 'SneakersSpot'}`);
console.log(`   Password: ${process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]'}\n`);

// Create a test connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'SneakersSpot',
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  try {
    console.log('🔌 Attempting to connect to PostgreSQL...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    console.log('\n📊 Testing simple query...');
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Query successful!');
    console.log('   Current Time:', result.rows[0].current_time);
    console.log('   PostgreSQL Version:', result.rows[0].postgres_version.split(' ')[0]);
    
    // Check if categories table exists
    console.log('\n🔍 Checking if categories table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Categories table exists');
      
      // Check categories count
      const countResult = await client.query('SELECT COUNT(*) as count FROM categories');
      console.log(`   📊 Categories in table: ${countResult.rows[0].count}`);
      
      if (parseInt(countResult.rows[0].count) > 0) {
        // Show some sample categories
        const sampleResult = await client.query('SELECT category_id, name, is_active FROM categories LIMIT 5');
        console.log('   📋 Sample categories:');
        sampleResult.rows.forEach(cat => {
          console.log(`      - ${cat.name} (ID: ${cat.category_id}) - ${cat.is_active ? 'Active' : 'Inactive'}`);
        });
      } else {
        console.log('   ⚠️ Categories table is empty');
      }
    } else {
      console.log('❌ Categories table does not exist');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Make sure PostgreSQL is running');
    console.log('   2. Check if the database "SneakersSpot" exists');
    console.log('   3. Verify the password is correct');
    console.log('   4. Check if the user has proper permissions');
    console.log('\n💡 Common solutions:');
    console.log('   - Start PostgreSQL service');
    console.log('   - Create database: CREATE DATABASE "SneakersSpot";');
    console.log('   - Check .env file for correct credentials');
  } finally {
    await pool.end();
  }
}

testConnection();
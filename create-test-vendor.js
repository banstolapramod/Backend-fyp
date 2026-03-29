const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'SneakersSpot',
  password: 'pramod',
  port: 5432,
});

async function createTestVendor() {
  try {
    console.log('🔍 Creating test vendor user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('Vendor123', 10);
    
    // Insert vendor user
    const result = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, vendor_status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        vendor_status = EXCLUDED.vendor_status,
        updated_at = NOW()
      RETURNING *
    `, [
      'Test Vendor',
      'testvendor@sneakersspot.com',
      hashedPassword,
      'vendor',
      'approved'
    ]);
    
    console.log('✅ Test vendor created successfully!');
    console.log('📧 Email: testvendor@sneakersspot.com');
    console.log('🔑 Password: Vendor123');
    console.log('👤 Role: vendor');
    console.log('✅ Status: approved');
    
  } catch (error) {
    console.error('❌ Error creating test vendor:', error.message);
  } finally {
    await pool.end();
  }
}

createTestVendor();
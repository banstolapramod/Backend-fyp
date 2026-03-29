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

async function createTestCustomer() {
  try {
    console.log('🔍 Creating test customer user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('Customer123', 10);
    
    // Insert customer user
    const result = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, vendor_status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        vendor_status = EXCLUDED.vendor_status,
        updated_at = NOW()
      RETURNING *
    `, [
      'Test Customer',
      'testcustomer@sneakersspot.com',
      hashedPassword,
      'customer',
      'approved'
    ]);
    
    console.log('✅ Test customer created successfully!');
    console.log('📧 Email: testcustomer@sneakersspot.com');
    console.log('🔑 Password: Customer123');
    console.log('👤 Role: customer');
    console.log('✅ Status: approved');
    
  } catch (error) {
    console.error('❌ Error creating test customer:', error.message);
  } finally {
    await pool.end();
  }
}

createTestCustomer();
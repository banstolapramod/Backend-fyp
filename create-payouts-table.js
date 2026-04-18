require('dotenv').config();
const pool = require('./src/config/db');

async function createPayoutsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_payouts (
        payout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID NOT NULL REFERENCES users(user_id),
        amount DECIMAL(10,2) NOT NULL,
        commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        note TEXT,
        paid_by UUID REFERENCES users(user_id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ vendor_payouts table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createPayoutsTable();

require('dotenv').config();
const pool = require('./src/config/db');

async function createKhaltiTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_khalti_orders (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(user_id),
        shipping_address JSONB NOT NULL,
        items_snapshot JSONB NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        processed BOOLEAN DEFAULT false,
        order_id UUID REFERENCES orders(order_id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ pending_khalti_orders table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating table:', err.message);
    process.exit(1);
  }
}

createKhaltiTable();

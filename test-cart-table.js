require('dotenv').config();
const { query } = require('./src/config/db');

async function testCartTable() {
  try {
    console.log('🛒 Testing cart table...');
    
    // Check if cart table exists
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'cart'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Cart table exists');
      
      // Get table structure
      const tableInfo = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'cart' 
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Cart table structure:');
      tableInfo.rows.forEach(row => {
        console.log(`    ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
      
      // Check current cart items
      const cartItems = await query('SELECT COUNT(*) FROM cart');
      console.log(`📊 Current cart items: ${cartItems.rows[0].count}`);
      
    } else {
      console.log('❌ Cart table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error testing cart table:', error);
  } finally {
    process.exit(0);
  }
}

testCartTable();
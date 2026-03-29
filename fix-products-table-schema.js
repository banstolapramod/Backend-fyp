require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'SneakersSpot',
});

async function fixProductsTableSchema() {
  try {
    console.log('🔍 Checking and fixing products table schema...\n');
    
    // Check if products table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Products table does not exist. Creating it...');
      
      // Create products table with correct schema
      await pool.query(`
        CREATE TABLE products (
          product_id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          category_id INTEGER,
          brand VARCHAR(100) NOT NULL,
          size VARCHAR(50),
          color VARCHAR(50),
          stock_quantity INTEGER DEFAULT 0,
          image_url TEXT,
          vendor_id INTEGER NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Products table created successfully');
    } else {
      console.log('✅ Products table exists');
    }
    
    // Check current schema
    console.log('\n🔍 Current products table schema:');
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position;
    `);
    
    schemaResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check for any UUID columns that shouldn't be there
    const uuidColumns = schemaResult.rows.filter(col => col.data_type === 'uuid');
    if (uuidColumns.length > 0) {
      console.log('\n⚠️ Found UUID columns that might be causing issues:');
      uuidColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // Ensure category_id column exists and is INTEGER
    const categoryIdColumn = schemaResult.rows.find(col => col.column_name === 'category_id');
    if (!categoryIdColumn) {
      console.log('\n🔧 Adding missing category_id column...');
      await pool.query('ALTER TABLE products ADD COLUMN category_id INTEGER');
      console.log('✅ category_id column added');
    } else if (categoryIdColumn.data_type !== 'integer') {
      console.log(`\n🔧 Fixing category_id column type (currently ${categoryIdColumn.data_type})...`);
      await pool.query('ALTER TABLE products ALTER COLUMN category_id TYPE INTEGER USING category_id::INTEGER');
      console.log('✅ category_id column type fixed');
    } else {
      console.log('\n✅ category_id column is correct (INTEGER)');
    }
    
    // Test inserting a sample product
    console.log('\n🧪 Testing product insertion...');
    try {
      const testResult = await pool.query(`
        INSERT INTO products (name, description, price, category_id, brand, size, color, stock_quantity, image_url, vendor_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING product_id, name
      `, [
        'Test Product',
        'Test Description', 
        99.99,
        1,
        'Test Brand',
        '10',
        'Red',
        5,
        'https://example.com/image.jpg',
        1
      ]);
      
      console.log('✅ Test product insertion successful:', testResult.rows[0]);
      
      // Clean up test product
      await pool.query('DELETE FROM products WHERE product_id = $1', [testResult.rows[0].product_id]);
      console.log('✅ Test product cleaned up');
      
    } catch (testError) {
      console.error('❌ Test product insertion failed:', testError.message);
      console.error('   Error code:', testError.code);
      console.error('   Error detail:', testError.detail);
    }
    
    console.log('\n🎉 Products table schema check completed!');
    
  } catch (error) {
    console.error('❌ Error fixing products table schema:', error);
  } finally {
    await pool.end();
  }
}

fixProductsTableSchema();
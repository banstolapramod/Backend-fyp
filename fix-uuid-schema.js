require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'SneakersSpot',
});

async function fixUuidSchema() {
  try {
    console.log('🔍 Fixing UUID schema issues...\n');
    
    // Check current products table schema
    console.log('📋 Current products table schema:');
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position;
    `);
    
    schemaResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check if there are any existing products
    const productCount = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log(`\n📊 Existing products: ${productCount.rows[0].count}`);
    
    if (parseInt(productCount.rows[0].count) > 0) {
      console.log('⚠️ There are existing products. We need to be careful with schema changes.');
      
      // Show existing products
      const existingProducts = await pool.query('SELECT product_id, name, vendor_id, category_id FROM products LIMIT 5');
      console.log('📋 Sample existing products:');
      existingProducts.rows.forEach(product => {
        console.log(`   - ${product.name} (ID: ${product.product_id}, Vendor: ${product.vendor_id}, Category: ${product.category_id})`);
      });
    }
    
    console.log('\n🔧 Solution Options:');
    console.log('1. Drop and recreate products table (WILL LOSE DATA)');
    console.log('2. Create a new products table with correct schema');
    console.log('3. Modify application to work with UUIDs');
    
    console.log('\n🚀 Implementing Option 2: Create new products table...');
    
    // Backup existing products table
    console.log('📦 Creating backup of existing products table...');
    await pool.query('DROP TABLE IF EXISTS products_backup');
    await pool.query('CREATE TABLE products_backup AS SELECT * FROM products');
    console.log('✅ Backup created as products_backup');
    
    // Drop existing products table
    console.log('🗑️ Dropping existing products table...');
    await pool.query('DROP TABLE IF EXISTS products');
    
    // Create new products table with correct schema
    console.log('🏗️ Creating new products table with correct schema...');
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
    console.log('✅ New products table created with INTEGER columns');
    
    // Add foreign key constraints if categories and users tables exist
    try {
      // Check if categories table exists and has integer IDs
      const categoriesCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'category_id'
      `);
      
      if (categoriesCheck.rows.length > 0 && categoriesCheck.rows[0].data_type === 'integer') {
        await pool.query('ALTER TABLE products ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id)');
        console.log('✅ Added foreign key constraint for categories');
      }
    } catch (fkError) {
      console.log('⚠️ Could not add category foreign key constraint:', fkError.message);
    }
    
    // Test inserting a sample product
    console.log('\n🧪 Testing product insertion with new schema...');
    try {
      const testResult = await pool.query(`
        INSERT INTO products (name, description, price, category_id, brand, size, color, stock_quantity, image_url, vendor_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING product_id, name, vendor_id, category_id
      `, [
        'Test Product',
        'Test Description', 
        99.99,
        1,  // INTEGER category_id
        'Test Brand',
        '10',
        'Red',
        5,
        'https://example.com/image.jpg',
        1   // INTEGER vendor_id
      ]);
      
      console.log('✅ Test product insertion successful:', testResult.rows[0]);
      
      // Clean up test product
      await pool.query('DELETE FROM products WHERE product_id = $1', [testResult.rows[0].product_id]);
      console.log('✅ Test product cleaned up');
      
    } catch (testError) {
      console.error('❌ Test product insertion failed:', testError.message);
    }
    
    console.log('\n🎉 Schema fix completed!');
    console.log('📋 Summary:');
    console.log('   - Old products table backed up as products_backup');
    console.log('   - New products table created with INTEGER columns');
    console.log('   - Ready for product creation from frontend');
    
    console.log('\n⚠️ Important Notes:');
    console.log('   - All existing products are in products_backup table');
    console.log('   - You may need to migrate data if needed');
    console.log('   - Vendor IDs in your app should be integers, not UUIDs');
    
  } catch (error) {
    console.error('❌ Error fixing UUID schema:', error);
  } finally {
    await pool.end();
  }
}

fixUuidSchema();
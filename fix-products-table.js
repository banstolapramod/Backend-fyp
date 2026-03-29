require("dotenv").config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/db');

async function fixProductsTable() {
  try {
    console.log('🔧 Fixing products table...');
    
    // Drop the existing products table if it exists (this will remove any existing data)
    console.log('🗑️ Dropping existing products table...');
    await query('DROP TABLE IF EXISTS products CASCADE;');
    console.log('✅ Existing products table dropped');
    
    // Create the products table with all required columns
    console.log('📦 Creating new products table...');
    await query(`
      CREATE TABLE products (
        product_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        size VARCHAR(50),
        color VARCHAR(50),
        stock_quantity INTEGER DEFAULT 0,
        image_url TEXT,
        vendor_id INTEGER NOT NULL REFERENCES users(user_id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ New products table created');
    
    // Create indexes
    console.log('📊 Creating indexes...');
    await query('CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);');
    await query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);');
    await query('CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);');
    await query('CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);');
    console.log('✅ Indexes created');
    
    // Insert some sample products for testing
    console.log('📦 Adding sample products...');
    
    // Get a vendor user ID
    const vendorResult = await query("SELECT user_id FROM users WHERE role = 'vendor' LIMIT 1");
    
    if (vendorResult.rows.length > 0) {
      const vendorId = vendorResult.rows[0].user_id;
      console.log('🔍 Using vendor ID:', vendorId);
      
      const sampleProducts = [
        {
          name: 'Nike Air Jordan 1 Retro High',
          description: 'Classic basketball sneaker with premium leather construction and iconic design.',
          price: 170.00,
          category: 'Basketball Shoes',
          brand: 'Nike',
          size: '10',
          color: 'Black/Red',
          stock_quantity: 25,
          image_url: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop&q=80&auto=format'
        },
        {
          name: 'Adidas Ultraboost 22',
          description: 'Revolutionary running shoe with responsive Boost midsole technology.',
          price: 190.00,
          category: 'Running Shoes',
          brand: 'Adidas',
          size: '9.5',
          color: 'White/Black',
          stock_quantity: 15,
          image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80&auto=format'
        },
        {
          name: 'Converse Chuck Taylor All Star',
          description: 'Timeless canvas sneaker that never goes out of style.',
          price: 65.00,
          category: 'Casual Shoes',
          brand: 'Converse',
          size: '8',
          color: 'White',
          stock_quantity: 30,
          image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop&q=80&auto=format'
        }
      ];
      
      for (const product of sampleProducts) {
        await query(`
          INSERT INTO products (name, description, price, category, brand, size, color, stock_quantity, image_url, vendor_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          product.name,
          product.description,
          product.price,
          product.category,
          product.brand,
          product.size,
          product.color,
          product.stock_quantity,
          product.image_url,
          vendorId
        ]);
        console.log(`✅ Added sample product: ${product.name}`);
      }
    } else {
      console.log('⚠️ No vendor users found, skipping sample products');
    }
    
    console.log('🎉 Products table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing products table:', error);
  }
  
  process.exit(0);
}

fixProductsTable();
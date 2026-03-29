require("dotenv").config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/db');

async function createSimpleCategories() {
  try {
    console.log('🔧 Creating simple categories table...');
    
    // Drop existing table to start fresh
    console.log('🗑️ Dropping existing categories table...');
    await query('DROP TABLE IF EXISTS categories CASCADE;');
    
    // Create simple categories table
    console.log('📂 Creating simple categories table...');
    await query(`
      CREATE TABLE categories (
        category_id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Simple categories table created');
    
    // Add default categories
    console.log('📦 Adding default categories...');
    const defaultCategories = [
      { name: 'Sneakers', description: 'Casual and lifestyle sneakers for everyday wear' },
      { name: 'Running Shoes', description: 'Performance running shoes for athletes and fitness enthusiasts' },
      { name: 'Basketball Shoes', description: 'High-performance basketball shoes for court play' },
      { name: 'Casual Shoes', description: 'Comfortable casual shoes for daily activities' },
      { name: 'Boots', description: 'Durable boots for various weather conditions and activities' },
      { name: 'Sandals', description: 'Comfortable sandals for warm weather and casual wear' },
      { name: 'Formal Shoes', description: 'Elegant formal shoes for business and special occasions' },
      { name: 'Athletic Shoes', description: 'Multi-purpose athletic shoes for various sports and activities' }
    ];
    
    for (const category of defaultCategories) {
      await query(`
        INSERT INTO categories (name, description)
        VALUES ($1, $2)
      `, [category.name, category.description]);
      console.log(`✅ Added category: ${category.name}`);
    }
    
    // Test the query
    console.log('🧪 Testing simple query...');
    const testResult = await query(`
      SELECT 
        category_id,
        name,
        description,
        created_at,
        updated_at
      FROM categories
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ Query test successful! Found ${testResult.rows.length} categories`);
    testResult.rows.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.description}`);
    });
    
    console.log('🎉 Simple categories table is ready!');
    
  } catch (error) {
    console.error('❌ Error creating simple categories:', error);
  }
  
  process.exit(0);
}

createSimpleCategories();
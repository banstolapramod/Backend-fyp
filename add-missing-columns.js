require("dotenv").config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/db');

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to categories table...');
    
    // Check if categories table exists
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'categories'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('📂 Categories table does not exist, creating it...');
      await query(`
        CREATE TABLE categories (
          category_id SERIAL PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Categories table created');
    } else {
      console.log('✅ Categories table exists');
    }
    
    // Check existing columns
    const columnsResult = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position;
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    console.log('🔍 Existing columns:', existingColumns);
    
    // Add missing columns
    const requiredColumns = [
      { name: 'is_active', definition: 'BOOLEAN DEFAULT true' },
      { name: 'description', definition: 'TEXT' },
      { name: 'created_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];
    
    for (const col of requiredColumns) {
      if (!existingColumns.includes(col.name)) {
        console.log(`➕ Adding missing column: ${col.name}`);
        await query(`ALTER TABLE categories ADD COLUMN ${col.name} ${col.definition};`);
        console.log(`✅ Added column: ${col.name}`);
      } else {
        console.log(`✅ Column ${col.name} already exists`);
      }
    }
    
    // Create indexes if they don't exist
    console.log('📊 Creating indexes...');
    await query('CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);');
    await query('CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);');
    console.log('✅ Indexes created');
    
    // Add some default categories if table is empty
    const countResult = await query('SELECT COUNT(*) as count FROM categories;');
    const categoryCount = parseInt(countResult.rows[0].count);
    
    if (categoryCount === 0) {
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
          INSERT INTO categories (name, description, is_active)
          VALUES ($1, $2, true)
        `, [category.name, category.description]);
        console.log(`✅ Added category: ${category.name}`);
      }
    } else {
      console.log(`✅ Categories table already has ${categoryCount} categories`);
    }
    
    // Test the query
    console.log('🧪 Testing CategoryModel query...');
    const testResult = await query(`
      SELECT 
        c.*,
        COUNT(p.product_id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.name = p.category AND p.is_active = true
      WHERE c.is_active = true
      GROUP BY c.category_id, c.name, c.description, c.is_active, c.created_at, c.updated_at
      ORDER BY c.created_at DESC
    `);
    
    console.log(`✅ Query test successful! Found ${testResult.rows.length} active categories`);
    testResult.rows.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.product_count} products (active: ${cat.is_active})`);
    });
    
    console.log('🎉 Categories table is now properly configured!');
    
  } catch (error) {
    console.error('❌ Error adding missing columns:', error);
  }
  
  process.exit(0);
}

addMissingColumns();
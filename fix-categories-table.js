require("dotenv").config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/db');

async function fixCategoriesTable() {
  try {
    console.log('🔧 Fixing categories table...');
    
    // Drop the existing categories table if it exists (this will remove any existing data)
    console.log('🗑️ Dropping existing categories table...');
    await query('DROP TABLE IF EXISTS categories CASCADE;');
    console.log('✅ Existing categories table dropped');
    
    // Create the categories table with all required columns
    console.log('📂 Creating new categories table...');
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
    console.log('✅ New categories table created');
    
    // Create indexes
    console.log('📊 Creating indexes...');
    await query('CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);');
    await query('CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);');
    console.log('✅ Indexes created');
    
    // Insert default categories
    console.log('📦 Adding default categories...');
    
    const defaultCategories = [
      {
        name: 'Sneakers',
        description: 'Casual and lifestyle sneakers for everyday wear'
      },
      {
        name: 'Running Shoes',
        description: 'Performance running shoes for athletes and fitness enthusiasts'
      },
      {
        name: 'Basketball Shoes',
        description: 'High-performance basketball shoes for court play'
      },
      {
        name: 'Casual Shoes',
        description: 'Comfortable casual shoes for daily activities'
      },
      {
        name: 'Boots',
        description: 'Durable boots for various weather conditions and activities'
      },
      {
        name: 'Sandals',
        description: 'Comfortable sandals for warm weather and casual wear'
      },
      {
        name: 'Formal Shoes',
        description: 'Elegant formal shoes for business and special occasions'
      },
      {
        name: 'Athletic Shoes',
        description: 'Multi-purpose athletic shoes for various sports and activities'
      }
    ];
    
    for (const category of defaultCategories) {
      await query(`
        INSERT INTO categories (name, description)
        VALUES ($1, $2)
      `, [category.name, category.description]);
      console.log(`✅ Added category: ${category.name}`);
    }
    
    // Verify the table structure
    console.log('🔍 Verifying table structure...');
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position;
    `);
    
    console.log('✅ Categories table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Test the findAll query
    console.log('🧪 Testing CategoryModel.findAll query...');
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
    
    console.log(`✅ Query test successful! Found ${testResult.rows.length} categories`);
    testResult.rows.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.product_count} products`);
    });
    
    console.log('🎉 Categories table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing categories table:', error);
  }
  
  process.exit(0);
}

fixCategoriesTable();
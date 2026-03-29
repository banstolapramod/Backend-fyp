const { query } = require('./src/config/db');

async function testCategories() {
  try {
    console.log('🔍 Testing categories...');
    
    // Test 1: Check if categories table exists
    console.log('\n1. Checking if categories table exists...');
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
      );
    `);
    
    console.log('Categories table exists:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Categories table does not exist. Creating it...');
      
      // Create categories table
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
    }
    
    // Test 2: Check existing categories
    console.log('\n2. Checking existing categories...');
    const categories = await query('SELECT * FROM categories ORDER BY category_id');
    console.log(`Found ${categories.rows.length} categories:`, categories.rows);
    
    // Test 3: Add default categories if none exist
    if (categories.rows.length === 0) {
      console.log('\n3. Adding default categories...');
      
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
        try {
          const result = await query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
            [category.name, category.description]
          );
          console.log(`✅ Created category: ${result.rows[0].name} (ID: ${result.rows[0].category_id})`);
        } catch (error) {
          console.error(`❌ Failed to create category ${category.name}:`, error.message);
        }
      }
    }
    
    // Test 4: Final check
    console.log('\n4. Final categories check...');
    const finalCategories = await query('SELECT * FROM categories ORDER BY category_id');
    console.log(`✅ Total categories: ${finalCategories.rows.length}`);
    finalCategories.rows.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.category_id})`);
    });
    
    // Test 5: Test the public API endpoint
    console.log('\n5. Testing public API endpoint...');
    try {
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/categories/public',
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log(`✅ API Response (${res.statusCode}):`, response);
          } catch (e) {
            console.log(`❌ API Response (${res.statusCode}) - Not JSON:`, data);
          }
        });
      });

      req.on('error', (err) => {
        console.error('❌ API Test failed:', err.message);
        console.log('💡 Make sure the backend server is running: cd Backend && node app.js');
      });

      req.on('timeout', () => {
        console.error('❌ API Test timed out');
        req.destroy();
      });

      req.end();
    } catch (apiError) {
      console.error('❌ API Test error:', apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCategories();
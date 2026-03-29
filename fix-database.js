require("dotenv").config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'SneakersSpot',
});

async function fixDatabase() {
  try {
    console.log('🔍 Checking database structure...');
    
    // Check if users table exists and its structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    if (tableInfo.rows.length > 0) {
      console.log('📋 Current users table structure:');
      tableInfo.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      
      // Check if password_hash column exists
      const hasPasswordHash = tableInfo.rows.some(row => row.column_name === 'password_hash');
      const hasPassword = tableInfo.rows.some(row => row.column_name === 'password');
      
      if (!hasPasswordHash && hasPassword) {
        console.log('🔧 Renaming password column to password_hash...');
        await pool.query('ALTER TABLE users RENAME COLUMN password TO password_hash;');
        console.log('✅ Column renamed successfully');
      } else if (!hasPasswordHash && !hasPassword) {
        console.log('🔧 Adding password_hash column...');
        await pool.query('ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT \'\';');
        console.log('✅ Column added successfully');
      }
      
      // Check if role column has proper constraint
      const roleColumn = tableInfo.rows.find(row => row.column_name === 'role');
      if (roleColumn && roleColumn.data_type !== 'character varying') {
        console.log('🔧 Updating role column...');
        await pool.query(`
          ALTER TABLE users 
          ALTER COLUMN role TYPE VARCHAR(30),
          ALTER COLUMN role SET DEFAULT 'customer';
        `);
        console.log('✅ Role column updated');
      }
      
      // Add is_active column if it doesn't exist
      const hasIsActive = tableInfo.rows.some(row => row.column_name === 'is_active');
      if (!hasIsActive) {
        console.log('🔧 Adding is_active column...');
        await pool.query('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;');
        console.log('✅ is_active column added');
      }
      
    } else {
      console.log('📋 Users table does not exist. Creating it...');
      await pool.query(`
        CREATE TABLE users (
          user_id SERIAL PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(30) DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Users table created');
    }
    
    // Create indexes
    console.log('🔧 Creating indexes...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);');
    console.log('✅ Indexes created');
    
    // Insert default users
    console.log('👥 Inserting default users...');
    const bcrypt = require('bcrypt');
    const defaultPassword = await bcrypt.hash('password', 10);
    
    const defaultUsers = [
      ['Admin User', 'admin@sneakersspot.com', defaultPassword, 'admin'],
      ['Vendor User', 'vendor@sneakersspot.com', defaultPassword, 'vendor'],
      ['Customer User', 'customer@sneakersspot.com', defaultPassword, 'customer']
    ];
    
    for (const [name, email, password_hash, role] of defaultUsers) {
      try {
        await pool.query(
          'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
          [name, email, password_hash, role]
        );
        console.log(`✅ User created/exists: ${email}`);
      } catch (error) {
        console.log(`⚠️  User ${email}: ${error.message}`);
      }
    }
    
    // Show final table structure
    console.log('\n📊 Final database structure:');
    const finalStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    finalStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Show users
    console.log('\n👥 Current users:');
    const users = await pool.query('SELECT user_id, name, email, role, created_at FROM users ORDER BY user_id;');
    users.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  } finally {
    await pool.end();
  }
}

fixDatabase();
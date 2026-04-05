const pool = require('../config/db');

// Resolve category name from UUID (safe — won't throw on bad UUID)
async function getCategoryName(category_id) {
  if (!category_id) return 'Sneakers';
  try {
    const r = await pool.query('SELECT name FROM categories WHERE category_id = $1', [category_id]);
    return r.rows[0]?.name || 'Sneakers';
  } catch {
    return 'Sneakers';
  }
}

class ProductModel {
  static async create(productData) {
    const { name, description, brand, category_id, size, price, stock_quantity, color, image_url, vendor_id } = productData;
    const categoryName = await getCategoryName(category_id);

    const result = await pool.query(`
      INSERT INTO products (vendor_id, name, description, brand, category, size, price, stock_quantity, color, image_url, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW())
      RETURNING product_id, vendor_id, name, description, brand, category, size, price, stock_quantity, color, image_url, is_active, created_at, updated_at
    `, [vendor_id, name, description, brand, categoryName, size, price, stock_quantity, color, image_url]);
    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query(`
      SELECT product_id, vendor_id, name, description, brand, category, size, price, stock_quantity, color, image_url, is_active, created_at, updated_at
      FROM products WHERE is_active = true ORDER BY created_at DESC
    `);
    return result.rows;
  }

  static async findByPk(productId) {
    const result = await pool.query(`
      SELECT p.product_id, p.vendor_id, p.name, p.description, p.brand, p.category,
             p.size, p.price, p.stock_quantity, p.color, p.image_url, p.is_active,
             p.created_at, p.updated_at,
             u.name as vendor_name, u.email as vendor_email
      FROM products p
      LEFT JOIN users u ON u.user_id = p.vendor_id
      WHERE p.product_id = $1 AND p.is_active = true
    `, [productId]);
    return result.rows[0] || null;
  }

  static async findByVendor(vendorId) {
    const result = await pool.query(`
      SELECT product_id, vendor_id, name, description, brand, category, size, price, stock_quantity, color, image_url, is_active, created_at, updated_at
      FROM products WHERE vendor_id = $1 AND is_active = true ORDER BY created_at DESC
    `, [vendorId]);
    return result.rows;
  }

  static async updateById(productId, productData) {
    const { name, description, brand, category_id, size, price, stock_quantity, color, image_url } = productData;
    const categoryName = await getCategoryName(category_id);

    const result = await pool.query(`
      UPDATE products SET name=$1, description=$2, brand=$3, category=$4, size=$5, price=$6, stock_quantity=$7, color=$8, image_url=$9, updated_at=NOW()
      WHERE product_id=$10 AND is_active=true
      RETURNING product_id, vendor_id, name, description, brand, category, size, price, stock_quantity, color, image_url, is_active, created_at, updated_at
    `, [name, description, brand, categoryName, size, price, stock_quantity, color, image_url, productId]);
    return result.rows[0] || null;
  }

  static async deleteById(productId) {
    const result = await pool.query(`
      UPDATE products SET is_active=false, updated_at=NOW() WHERE product_id=$1
      RETURNING product_id, name
    `, [productId]);
    return result.rows[0] || null;
  }

  static async addStock(productId, quantity) {
    const result = await pool.query(`
      UPDATE products SET stock_quantity=stock_quantity+$1, updated_at=NOW()
      WHERE product_id=$2 AND is_active=true
      RETURNING product_id, name, stock_quantity
    `, [quantity, productId]);
    return result.rows[0] || null;
  }

  static async getVendorStats(vendorId) {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_products,
        COALESCE(SUM(stock_quantity), 0) as total_stock,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN stock_quantity > 0 AND stock_quantity < 10 THEN 1 END) as low_stock
      FROM products WHERE vendor_id=$1 AND is_active=true
    `, [vendorId]);
    return result.rows[0];
  }
}

module.exports = ProductModel;

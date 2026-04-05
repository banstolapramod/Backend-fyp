const pool = require('../config/db');

// Public: active categories for dropdowns
exports.getActiveCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT category_id, name, description FROM categories ORDER BY name ASC');
    res.json({ success: true, categories: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories', details: err.message });
  }
};

// Public alias
exports.getPublicCategories = exports.getActiveCategories;

// Public: all categories
exports.getAllCategoriesPublic = async (req, res) => {
  try {
    const result = await pool.query('SELECT category_id, name, description FROM categories ORDER BY name ASC');
    res.json({ success: true, categories: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories', details: err.message });
  }
};

// Admin: all categories with full details
exports.getAllCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT category_id, name, description, created_at FROM categories ORDER BY name ASC');
    res.json({ success: true, categories: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories', details: err.message });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE category_id=$1', [req.params.categoryId]);
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Category not found' });
    res.json({ success: true, category: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch category', details: err.message });
  }
};

// Category stats
exports.getCategoryStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.category_id, c.name, COUNT(p.product_id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category = c.name AND p.is_active = true
      GROUP BY c.category_id, c.name ORDER BY c.name ASC
    `);
    res.json({ success: true, stats: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch category stats', details: err.message });
  }
};

// Create category (admin only)
exports.createCategory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Category name is required' });

    const result = await pool.query(
      'INSERT INTO categories (name, description, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [name, description || null]
    );
    res.status(201).json({ success: true, message: 'Category created successfully', category: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, error: 'Category already exists' });
    res.status(500).json({ success: false, error: 'Failed to create category', details: err.message });
  }
};

// Update category (admin only)
exports.updateCategory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const { name, description } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name=$1, description=$2 WHERE category_id=$3 RETURNING *',
      [name, description || null, req.params.categoryId]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Category not found' });
    res.json({ success: true, message: 'Category updated successfully', category: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update category', details: err.message });
  }
};

// Delete category (admin only)
exports.deleteCategory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }
    const result = await pool.query('DELETE FROM categories WHERE category_id=$1 RETURNING *', [req.params.categoryId]);
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Category not found' });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete category', details: err.message });
  }
};

const ProductModel = require("../model/productModel");

// Create product (vendor only)
exports.createProduct = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ success: false, error: "Access denied. Vendor only." });
    }

    let image_url = null;
    if (req.file) {
      image_url = `/uploads/products/${req.file.filename}`;
    }

    const productData = { ...req.body, vendor_id: req.user.id, image_url };
    const product = await ProductModel.create(productData);

    res.status(201).json({ success: true, message: "Product created successfully", product });
  } catch (err) {
    console.error('CREATE PRODUCT ERROR:', err);
    res.status(500).json({ success: false, error: "Failed to create product", details: err.message });
  }
};

// Get all products (public)
exports.getAllProducts = async (req, res) => {
  try {
    const products = await ProductModel.findAll();
    res.json({ success: true, products, count: products.length });
  } catch (err) {
    console.error('GET ALL PRODUCTS ERROR:', err);
    res.status(500).json({ success: false, error: "Failed to fetch products", details: err.message });
  }
};

// Get public vendor profile + their products
exports.getVendorProfile = async (req, res) => {
  try {
    const pool = require('../config/db');
    const { vendorId } = req.params;

    const vendor = await pool.query(
      `SELECT user_id, name, email, created_at FROM users WHERE user_id = $1 AND role = 'vendor' AND is_active = true`,
      [vendorId]
    );
    if (!vendor.rows[0]) return res.status(404).json({ success: false, error: 'Vendor not found' });

    const products = await ProductModel.findByVendor(vendorId);

    const stats = await pool.query(
      `SELECT COUNT(*) as total_products,
              COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as in_stock
       FROM products WHERE vendor_id = $1 AND is_active = true`,
      [vendorId]
    );

    res.json({
      success: true,
      vendor: vendor.rows[0],
      products,
      stats: stats.rows[0]
    });
  } catch (err) {
    console.error('GET VENDOR PROFILE ERROR:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch vendor profile', details: err.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const productId = req.params.productId || req.params.id;
    const product = await ProductModel.findByPk(productId);
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    console.error('GET PRODUCT BY ID ERROR:', err);
    res.status(500).json({ success: false, error: "Failed to fetch product", details: err.message });
  }
};

// Get vendor products
exports.getVendorProducts = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ success: false, error: "Access denied. Vendor only." });
    }

    const products = await ProductModel.findByVendor(req.user.id);
    const stats = await ProductModel.getVendorStats(req.user.id);

    res.json({ success: true, products, stats, count: products.length });
  } catch (err) {
    console.error('GET VENDOR PRODUCTS ERROR:', err);
    res.status(500).json({ success: false, error: "Failed to fetch vendor products", details: err.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ success: false, error: "Access denied. Vendor only." });
    }

    const productId = req.params.productId || req.params.id;
    const existing = await ProductModel.findByPk(productId);
    if (!existing) return res.status(404).json({ success: false, error: "Product not found" });
    if (existing.vendor_id !== req.user.id) {
      return res.status(403).json({ success: false, error: "Access denied. You can only update your own products." });
    }

    let updateData = { ...req.body };
    if (req.file) {
      updateData.image_url = `/uploads/products/${req.file.filename}`;
    }

    const updatedProduct = await ProductModel.updateById(productId, updateData);
    res.json({ success: true, message: "Product updated successfully", product: updatedProduct });
  } catch (err) {
    console.error('UPDATE PRODUCT ERROR:', err);
    res.status(500).json({ success: false, error: "Failed to update product", details: err.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ success: false, error: "Access denied. Vendor only." });
    }

    const productId = req.params.productId || req.params.id;
    const existing = await ProductModel.findByPk(productId);
    if (!existing) return res.status(404).json({ success: false, error: "Product not found" });
    if (existing.vendor_id !== req.user.id) {
      return res.status(403).json({ success: false, error: "Access denied. You can only delete your own products." });
    }

    const deleted = await ProductModel.deleteById(productId);
    res.json({ success: true, message: "Product deleted successfully", product: deleted });
  } catch (err) {
    console.error('DELETE PRODUCT ERROR:', err);
    res.status(500).json({ success: false, error: "Failed to delete product", details: err.message });
  }
};

// Get vendor stats
exports.getVendorStats = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ success: false, error: "Access denied. Vendor only." });
    }
    const stats = await ProductModel.getVendorStats(req.user.id);
    res.json({ success: true, stats });
  } catch (err) {
    console.error('GET VENDOR STATS ERROR:', err);
    res.status(500).json({ success: false, error: "Failed to fetch vendor statistics", details: err.message });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ success: false, error: "Access denied. Vendor only." });
    }

    const productId = req.params.productId;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, error: "Valid quantity is required" });
    }

    const existing = await ProductModel.findByPk(productId);
    if (!existing) return res.status(404).json({ success: false, error: "Product not found" });
    if (existing.vendor_id !== req.user.id) {
      return res.status(403).json({ success: false, error: "Access denied. You can only update your own products." });
    }

    const updated = await ProductModel.addStock(productId, parseInt(quantity));
    res.json({ success: true, message: `Added ${quantity} items to stock`, product: updated });
  } catch (err) {
    console.error('UPDATE STOCK ERROR:', err);
    res.status(500).json({ success: false, error: "Failed to update stock", details: err.message });
  }
};

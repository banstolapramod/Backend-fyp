require("dotenv").config({ path: require('path').join(__dirname, '.env') });
const ProductModel = require("./src/model/product.model");
const UserModel = require("./src/model/user.model");

async function testProducts() {
  try {
    console.log("🔍 Testing product functionality...");
    
    // Find a vendor user
    const vendors = await UserModel.findAllVendors(1, 0);
    if (vendors.length === 0) {
      console.log("❌ No vendors found. Please create a vendor user first.");
      return;
    }
    
    const vendor = vendors[0];
    console.log(`✅ Using vendor: ${vendor.name} (ID: ${vendor.user_id})`);
    
    // Test creating a product
    const testProduct = {
      name: "Test Nike Air Jordan 1",
      description: "Classic basketball sneaker with premium leather construction",
      price: 159.99,
      category: "Basketball Shoes",
      brand: "Nike",
      size: "10",
      color: "Black/Red",
      stock_quantity: 25,
      image_url: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop&q=80&auto=format",
      vendor_id: vendor.user_id
    };
    
    console.log("📦 Creating test product...");
    const createdProduct = await ProductModel.create(testProduct);
    console.log("✅ Product created:", {
      product_id: createdProduct.product_id,
      name: createdProduct.name,
      price: createdProduct.price,
      vendor_id: createdProduct.vendor_id
    });
    
    // Test getting vendor products
    console.log("📋 Getting vendor products...");
    const vendorProducts = await ProductModel.findByVendorId(vendor.user_id);
    console.log(`✅ Found ${vendorProducts.length} products for vendor`);
    
    // Test getting vendor stats
    console.log("📊 Getting vendor stats...");
    const stats = await ProductModel.getVendorStats(vendor.user_id);
    console.log("✅ Vendor stats:", {
      total_products: stats.total_products,
      in_stock: stats.in_stock,
      out_of_stock: stats.out_of_stock,
      low_stock: stats.low_stock,
      avg_price: parseFloat(stats.avg_price).toFixed(2),
      total_stock: stats.total_stock
    });
    
    // Test updating product
    console.log("✏️ Updating product...");
    const updatedProduct = await ProductModel.updateById(
      createdProduct.product_id,
      { 
        name: "Updated Nike Air Jordan 1 Retro",
        price: 169.99,
        stock_quantity: 30
      },
      vendor.user_id
    );
    console.log("✅ Product updated:", {
      name: updatedProduct.name,
      price: updatedProduct.price,
      stock_quantity: updatedProduct.stock_quantity
    });
    
    // Test soft delete
    console.log("🗑️ Soft deleting product...");
    const deletedProduct = await ProductModel.deleteById(createdProduct.product_id, vendor.user_id);
    console.log("✅ Product soft deleted:", deletedProduct.name);
    
    console.log("🎉 All product tests passed!");
    
  } catch (error) {
    console.error("❌ Error testing products:", error);
  }
  
  process.exit(0);
}

testProducts();
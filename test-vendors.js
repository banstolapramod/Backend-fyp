require("dotenv").config({ path: require('path').join(__dirname, '.env') });
const UserModel = require("./src/model/user.model");

async function testVendors() {
  try {
    console.log("🔍 Testing vendors...");
    
    // Get all vendors
    const vendors = await UserModel.findAllVendors(100, 0);
    
    console.log(`✅ Found ${vendors.length} vendors:`);
    vendors.forEach(vendor => {
      console.log({
        user_id: vendor.user_id,
        user_id_type: typeof vendor.user_id,
        name: vendor.name,
        email: vendor.email,
        role: vendor.role,
        vendor_status: vendor.vendor_status
      });
    });
    
  } catch (error) {
    console.error("❌ Error testing vendors:", error);
  }
  
  process.exit(0);
}

testVendors();
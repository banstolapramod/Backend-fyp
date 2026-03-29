require("dotenv").config({ path: require('path').join(__dirname, '.env') });
const jwt = require("jsonwebtoken");

async function testJWT() {
  try {
    console.log("🔍 Testing JWT...");
    console.log("🔍 JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set");
    
    // Create a test token
    const testPayload = {
      id: "test-admin-id",
      email: "testadmin@sneakersspot.com",
      role: "admin"
    };
    
    const token = jwt.sign(testPayload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
    console.log("✅ Token created:", token.substring(0, 50) + '...');
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    console.log("✅ Token verified:", decoded);
    
  } catch (error) {
    console.error("❌ JWT test error:", error);
  }
  
  process.exit(0);
}

testJWT();
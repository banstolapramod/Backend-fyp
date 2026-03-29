require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testCartAPI() {
  try {
    console.log('🛒 Testing Cart API endpoints...');
    
    // First, let's login to get a token
    console.log('🔐 Logging in to get authentication token...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'testadmin@sneakersspot.com',
      password: 'Admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test GET /api/cart (get cart items)
    console.log('\n📋 Testing GET /api/cart...');
    try {
      const getCartResponse = await axios.get(`${BASE_URL}/api/cart`, { headers });
      console.log('✅ GET /api/cart successful');
      console.log(`   Cart items: ${getCartResponse.data.items.length}`);
    } catch (error) {
      console.log('❌ GET /api/cart failed:', error.response?.data?.message || error.message);
    }
    
    // Test POST /api/cart (add item to cart)
    console.log('\n➕ Testing POST /api/cart...');
    try {
      // First, let's get a product ID to add to cart
      const productsResponse = await axios.get(`${BASE_URL}/api/products`);
      if (productsResponse.data.length > 0) {
        const productId = productsResponse.data[0].product_id;
        console.log(`   Using product ID: ${productId}`);
        
        const addToCartResponse = await axios.post(`${BASE_URL}/api/cart`, {
          product_id: productId,
          quantity: 2
        }, { headers });
        
        console.log('✅ POST /api/cart successful');
        console.log(`   Added item: ${addToCartResponse.data.message}`);
      } else {
        console.log('⚠️  No products available to add to cart');
      }
    } catch (error) {
      console.log('❌ POST /api/cart failed:', error.response?.data?.message || error.message);
    }
    
    // Test GET /api/cart again to see the added item
    console.log('\n📋 Testing GET /api/cart again...');
    try {
      const getCartResponse2 = await axios.get(`${BASE_URL}/api/cart`, { headers });
      console.log('✅ GET /api/cart successful');
      console.log(`   Cart items: ${getCartResponse2.data.items.length}`);
      if (getCartResponse2.data.items.length > 0) {
        console.log('   Cart contents:');
        getCartResponse2.data.items.forEach(item => {
          console.log(`     - ${item.product_name} (Qty: ${item.quantity})`);
        });
      }
    } catch (error) {
      console.log('❌ GET /api/cart failed:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing cart API:', error.response?.data?.message || error.message);
  }
}

testCartAPI();
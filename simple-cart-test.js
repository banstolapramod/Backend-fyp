const fetch = require('node-fetch');

async function testCart() {
  try {
    console.log('Testing cart API...');
    
    // Test the test route first
    const testResponse = await fetch('http://localhost:5001/api/cart/test');
    const testData = await testResponse.json();
    console.log('✅ Test route:', testData.message);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCart();
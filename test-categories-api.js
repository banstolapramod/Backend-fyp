const http = require('http');

// Test if category routes are working
function testCategoryRoutes() {
  console.log('🔍 Testing category API endpoints...');
  
  // Test 1: Basic category test endpoint
  console.log('\n1. Testing basic category route...');
  const testOptions = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/categories/test',
    method: 'GET',
    timeout: 5000
  };

  const testReq = http.request(testOptions, (res) => {
    console.log(`✅ Test endpoint status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`✅ Test response:`, response);
        
        // Test 2: Public categories endpoint
        testPublicCategories();
      } catch (e) {
        console.log(`❌ Test response (not JSON):`, data);
      }
    });
  });

  testReq.on('error', (err) => {
    console.error('❌ Test endpoint failed:', err.message);
    console.log('💡 Make sure the backend server is running: cd Backend && node app.js');
  });

  testReq.on('timeout', () => {
    console.error('❌ Test endpoint timed out');
    testReq.destroy();
  });

  testReq.end();
}

function testPublicCategories() {
  console.log('\n2. Testing public categories endpoint...');
  const publicOptions = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/categories/public',
    method: 'GET',
    timeout: 5000
  };

  const publicReq = http.request(publicOptions, (res) => {
    console.log(`✅ Public categories status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`✅ Public categories response:`, response);
        
        // Test 3: Protected categories endpoint (should fail without auth)
        testProtectedCategories();
      } catch (e) {
        console.log(`❌ Public categories response (not JSON):`, data);
      }
    });
  });

  publicReq.on('error', (err) => {
    console.error('❌ Public categories failed:', err.message);
  });

  publicReq.on('timeout', () => {
    console.error('❌ Public categories timed out');
    publicReq.destroy();
  });

  publicReq.end();
}

function testProtectedCategories() {
  console.log('\n3. Testing protected categories endpoint (should return 401)...');
  const protectedOptions = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/categories',
    method: 'GET',
    timeout: 5000
  };

  const protectedReq = http.request(protectedOptions, (res) => {
    console.log(`✅ Protected categories status: ${res.statusCode} (expected 401)`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`✅ Protected categories response:`, response);
      } catch (e) {
        console.log(`❌ Protected categories response (not JSON):`, data);
      }
      
      console.log('\n🎉 Category API tests completed!');
      console.log('\nNext steps:');
      console.log('1. If all tests passed, the backend is working correctly');
      console.log('2. Check if you are logged in as an admin in the frontend');
      console.log('3. Check browser network tab for the actual request being made');
      process.exit(0);
    });
  });

  protectedReq.on('error', (err) => {
    console.error('❌ Protected categories failed:', err.message);
    process.exit(1);
  });

  protectedReq.on('timeout', () => {
    console.error('❌ Protected categories timed out');
    protectedReq.destroy();
    process.exit(1);
  });

  protectedReq.end();
}

testCategoryRoutes();
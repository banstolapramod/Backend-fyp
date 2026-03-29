const http = require('http');

console.log('🔍 Testing Public Categories API Endpoints...\n');

// Test the public endpoints
const endpoints = [
  {
    name: 'Active Categories Only',
    path: '/api/categories/public',
    description: 'Returns only active categories'
  },
  {
    name: 'All Categories',
    path: '/api/categories/all',
    description: 'Returns all categories (active and inactive)'
  },
  {
    name: 'Test Endpoint',
    path: '/api/categories/test',
    description: 'Simple test to verify routes are working'
  }
];

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    console.log(`\n📡 Testing: ${endpoint.name}`);
    console.log(`   URL: http://localhost:5001${endpoint.path}`);
    console.log(`   Description: ${endpoint.description}`);
    
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: endpoint.path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`   ✅ Status: ${res.statusCode}`);
          console.log(`   ✅ Response:`, JSON.stringify(response, null, 2));
          
          if (response.categories) {
            console.log(`   📊 Categories found: ${response.categories.length}`);
            response.categories.forEach((cat, index) => {
              console.log(`      ${index + 1}. ${cat.name} (ID: ${cat.category_id}) - ${cat.is_active ? 'Active' : 'Inactive'}`);
            });
          }
        } catch (e) {
          console.log(`   ❌ Response (${res.statusCode}) - Not JSON:`, data);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error(`   ❌ Request failed:`, err.message);
      console.log('   💡 Make sure the backend server is running: cd Backend && node app.js');
      resolve();
    });

    req.on('timeout', () => {
      console.error(`   ❌ Request timed out`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting API tests...');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n🎉 API tests completed!');
  console.log('\n📋 Available Public API Endpoints:');
  console.log('   GET http://localhost:5001/api/categories/public  - Active categories only');
  console.log('   GET http://localhost:5001/api/categories/all     - All categories');
  console.log('   GET http://localhost:5001/api/categories/test    - Test endpoint');
  console.log('\n💡 These endpoints require NO authentication and can be used by anyone!');
}

runTests();
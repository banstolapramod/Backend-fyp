const http = require('http');

// Test if server is running
function testServer() {
  console.log('🔍 Testing if backend server is running...');
  
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/products/public',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Server is running! Status: ${res.statusCode}`);
    console.log(`📡 Response headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`📦 Response data:`, response);
      } catch (e) {
        console.log(`📄 Raw response:`, data);
      }
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.error('❌ Server is not running or not accessible:', err.message);
    console.log('💡 Please start the backend server with: npm start');
    process.exit(1);
  });

  req.on('timeout', () => {
    console.error('❌ Request timed out - server may not be running');
    console.log('💡 Please start the backend server with: npm start');
    req.destroy();
    process.exit(1);
  });

  req.end();
}

testServer();
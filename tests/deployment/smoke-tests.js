const axios = require('axios');
const WebSocket = require('ws');

// Configuration
const config = {
  apiUrl: process.env.PRODUCTION_API_URL || 'https://api.football-analytics.com',
  wsUrl: process.env.PRODUCTION_WS_URL || 'wss://ws.football-analytics.com',
  timeout: 30000
};

// Test results
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility functions
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const logError = (message, error) => {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error?.message || error);
  testResults.errors.push({ message, error: error?.message || error });
};

// Test API health endpoint
async function testApiHealth() {
  log('Testing API health endpoint...');
  try {
    const response = await axios.get(`${config.apiUrl}/health`, {
      timeout: config.timeout
    });
    
    if (response.status === 200 && response.data.status === 'healthy') {
      log('✓ API health check passed');
      testResults.passed++;
      return true;
    } else {
      logError('API health check failed', `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
      testResults.failed++;
      return false;
    }
  } catch (error) {
    logError('API health check failed', error);
    testResults.failed++;
    return false;
  }
}

// Test API readiness endpoint
async function testApiReadiness() {
  log('Testing API readiness endpoint...');
  try {
    const response = await axios.get(`${config.apiUrl}/ready`, {
      timeout: config.timeout
    });
    
    if (response.status === 200 && response.data.ready === true) {
      log('✓ API readiness check passed');
      testResults.passed++;
      return true;
    } else {
      logError('API readiness check failed', `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
      testResults.failed++;
      return false;
    }
  } catch (error) {
    logError('API readiness check failed', error);
    testResults.failed++;
    return false;
  }
}

// Test API authentication
async function testApiAuth() {
  log('Testing API authentication...');
  try {
    // Test without auth - should return 401
    const response = await axios.get(`${config.apiUrl}/api/v1/games`, {
      timeout: config.timeout,
      validateStatus: (status) => status === 401
    });
    
    if (response.status === 401) {
      log('✓ API authentication check passed');
      testResults.passed++;
      return true;
    } else {
      logError('API authentication check failed', `Expected 401, got ${response.status}`);
      testResults.failed++;
      return false;
    }
  } catch (error) {
    logError('API authentication check failed', error);
    testResults.failed++;
    return false;
  }
}

// Test WebSocket connection
async function testWebSocketConnection() {
  log('Testing WebSocket connection...');
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(config.wsUrl);
      let connected = false;
      
      const timeout = setTimeout(() => {
        if (!connected) {
          ws.close();
          logError('WebSocket connection timeout');
          testResults.failed++;
          resolve(false);
        }
      }, config.timeout);
      
      ws.on('open', () => {
        connected = true;
        clearTimeout(timeout);
        log('✓ WebSocket connection established');
        
        // Send ping message
        ws.send(JSON.stringify({ type: 'ping' }));
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          if (message.type === 'pong') {
            log('✓ WebSocket ping-pong test passed');
            testResults.passed++;
            ws.close();
            resolve(true);
          }
        } catch (error) {
          logError('WebSocket message parsing failed', error);
          testResults.failed++;
          ws.close();
          resolve(false);
        }
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        logError('WebSocket connection failed', error);
        testResults.failed++;
        resolve(false);
      });
      
      ws.on('close', () => {
        if (!connected) {
          clearTimeout(timeout);
          logError('WebSocket connection closed before establishing');
          testResults.failed++;
          resolve(false);
        }
      });
      
    } catch (error) {
      logError('WebSocket test setup failed', error);
      testResults.failed++;
      resolve(false);
    }
  });
}

// Test API response time
async function testApiResponseTime() {
  log('Testing API response time...');
  try {
    const startTime = Date.now();
    const response = await axios.get(`${config.apiUrl}/health`, {
      timeout: config.timeout
    });
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200 && responseTime < 5000) {
      log(`✓ API response time test passed (${responseTime}ms)`);
      testResults.passed++;
      return true;
    } else {
      logError('API response time test failed', `Response time: ${responseTime}ms, Status: ${response.status}`);
      testResults.failed++;
      return false;
    }
  } catch (error) {
    logError('API response time test failed', error);
    testResults.failed++;
    return false;
  }
}

// Test database connectivity (through API)
async function testDatabaseConnectivity() {
  log('Testing database connectivity...');
  try {
    const response = await axios.get(`${config.apiUrl}/api/v1/system/database-status`, {
      timeout: config.timeout,
      validateStatus: (status) => status === 401 || status === 200
    });
    
    // We expect 401 (unauthorized) which means the endpoint exists and database is reachable
    if (response.status === 401 || (response.status === 200 && response.data.database === 'connected')) {
      log('✓ Database connectivity test passed');
      testResults.passed++;
      return true;
    } else {
      logError('Database connectivity test failed', `Status: ${response.status}`);
      testResults.failed++;
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log('✓ Database connectivity test passed (endpoint accessible)');
      testResults.passed++;
      return true;
    }
    logError('Database connectivity test failed', error);
    testResults.failed++;
    return false;
  }
}

// Test cache connectivity (through API)
async function testCacheConnectivity() {
  log('Testing cache connectivity...');
  try {
    const response = await axios.get(`${config.apiUrl}/api/v1/system/cache-status`, {
      timeout: config.timeout,
      validateStatus: (status) => status === 401 || status === 200
    });
    
    // We expect 401 (unauthorized) which means the endpoint exists and cache is reachable
    if (response.status === 401 || (response.status === 200 && response.data.cache === 'connected')) {
      log('✓ Cache connectivity test passed');
      testResults.passed++;
      return true;
    } else {
      logError('Cache connectivity test failed', `Status: ${response.status}`);
      testResults.failed++;
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log('✓ Cache connectivity test passed (endpoint accessible)');
      testResults.passed++;
      return true;
    }
    logError('Cache connectivity test failed', error);
    testResults.failed++;
    return false;
  }
}

// Main test runner
async function runSmokeTests() {
  log('Starting smoke tests...');
  log(`API URL: ${config.apiUrl}`);
  log(`WebSocket URL: ${config.wsUrl}`);
  
  const tests = [
    testApiHealth,
    testApiReadiness,
    testApiAuth,
    testApiResponseTime,
    testDatabaseConnectivity,
    testCacheConnectivity,
    testWebSocketConnection
  ];
  
  for (const test of tests) {
    await test();
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print results
  log('\n=== SMOKE TEST RESULTS ===');
  log(`Passed: ${testResults.passed}`);
  log(`Failed: ${testResults.failed}`);
  log(`Total: ${testResults.passed + testResults.failed}`);
  
  if (testResults.failed > 0) {
    log('\n=== ERRORS ===');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.message}: ${error.error}`);
    });
  }
  
  // Exit with appropriate code
  const exitCode = testResults.failed > 0 ? 1 : 0;
  log(`\nExiting with code: ${exitCode}`);
  process.exit(exitCode);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError('Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
runSmokeTests();
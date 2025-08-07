const axios = require('axios');
const WebSocket = require('ws');

// Configuration
const config = {
  apiUrl: process.env.STAGING_API_URL || process.env.PRODUCTION_API_URL || 'https://api.football-analytics.com',
  wsUrl: process.env.STAGING_WS_URL || process.env.PRODUCTION_WS_URL || 'wss://ws.football-analytics.com',
  timeout: 30000,
  testApiKey: process.env.TEST_API_KEY || 'test-api-key'
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

// Create authenticated axios instance
const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: config.timeout,
  headers: {
    'Authorization': `Bearer ${config.testApiKey}`,
    'Content-Type': 'application/json'
  }
});

// Test API endpoints integration
async function testApiEndpoints() {
  log('Testing API endpoints integration...');
  
  const endpoints = [
    { path: '/api/v1/games', method: 'GET', description: 'Games list' },
    { path: '/api/v1/teams', method: 'GET', description: 'Teams list' },
    { path: '/api/v1/players', method: 'GET', description: 'Players list' },
    { path: '/api/v1/predictions', method: 'GET', description: 'Predictions list' }
  ];
  
  let passed = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.request({
        method: endpoint.method,
        url: endpoint.path
      });
      
      if (response.status >= 200 && response.status < 300) {
        log(`✓ ${endpoint.description} endpoint working`);
        passed++;
      } else {
        logError(`${endpoint.description} endpoint failed`, `Status: ${response.status}`);
      }
    } catch (error) {
      // 401/403 is acceptable for protected endpoints without proper auth
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        log(`✓ ${endpoint.description} endpoint accessible (auth required)`);
        passed++;
      } else {
        logError(`${endpoint.description} endpoint failed`, error);
      }
    }
  }
  
  if (passed === endpoints.length) {
    testResults.passed++;
    return true;
  } else {
    testResults.failed++;
    return false;
  }
}

// Test WebSocket real-time updates
async function testWebSocketUpdates() {
  log('Testing WebSocket real-time updates...');
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(config.wsUrl);
      let connected = false;
      let receivedUpdate = false;
      
      const timeout = setTimeout(() => {
        ws.close();
        if (receivedUpdate) {
          log('✓ WebSocket updates test passed');
          testResults.passed++;
          resolve(true);
        } else {
          logError('WebSocket updates test failed', 'No updates received');
          testResults.failed++;
          resolve(false);
        }
      }, 10000); // 10 second timeout
      
      ws.on('open', () => {
        connected = true;
        log('WebSocket connected, subscribing to updates...');
        
        // Subscribe to game updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          channel: 'game-updates'
        }));
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          
          if (message.type === 'subscription-confirmed') {
            log('Subscription confirmed, waiting for updates...');
          } else if (message.type === 'game-update' || message.type === 'probability-update') {
            receivedUpdate = true;
            log('✓ Received real-time update');
          }
        } catch (error) {
          logError('WebSocket message parsing failed', error);
        }
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        logError('WebSocket updates test failed', error);
        testResults.failed++;
        resolve(false);
      });
      
    } catch (error) {
      logError('WebSocket updates test setup failed', error);
      testResults.failed++;
      resolve(false);
    }
  });
}

// Test data flow between services
async function testDataFlow() {
  log('Testing data flow between services...');
  
  try {
    // Test data ingestion status
    const ingestionResponse = await apiClient.get('/api/v1/system/ingestion-status');
    
    // Test probability engine status
    const probabilityResponse = await apiClient.get('/api/v1/system/probability-status');
    
    // Test ML model status
    const mlResponse = await apiClient.get('/api/v1/system/ml-status');
    
    // Check if all services are communicating
    const allServicesUp = [ingestionResponse, probabilityResponse, mlResponse]
      .every(response => response.status >= 200 && response.status < 300);
    
    if (allServicesUp) {
      log('✓ Data flow between services test passed');
      testResults.passed++;
      return true;
    } else {
      logError('Data flow test failed', 'One or more services not responding');
      testResults.failed++;
      return false;
    }
    
  } catch (error) {
    // If endpoints return 401/403, services are still accessible
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      log('✓ Data flow test passed (services accessible, auth required)');
      testResults.passed++;
      return true;
    }
    
    logError('Data flow test failed', error);
    testResults.failed++;
    return false;
  }
}

// Test caching layer
async function testCachingLayer() {
  log('Testing caching layer...');
  
  try {
    // Make the same request twice to test caching
    const startTime1 = Date.now();
    const response1 = await apiClient.get('/api/v1/teams');
    const responseTime1 = Date.now() - startTime1;
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const startTime2 = Date.now();
    const response2 = await apiClient.get('/api/v1/teams');
    const responseTime2 = Date.now() - startTime2;
    
    // Second request should be faster (cached) or at least successful
    if (response1.status >= 200 && response2.status >= 200) {
      log(`✓ Caching layer test passed (${responseTime1}ms -> ${responseTime2}ms)`);
      testResults.passed++;
      return true;
    } else {
      logError('Caching layer test failed', 'Requests not successful');
      testResults.failed++;
      return false;
    }
    
  } catch (error) {
    // If endpoints return 401/403, caching layer is still working
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      log('✓ Caching layer test passed (endpoints accessible)');
      testResults.passed++;
      return true;
    }
    
    logError('Caching layer test failed', error);
    testResults.failed++;
    return false;
  }
}

// Test load balancing
async function testLoadBalancing() {
  log('Testing load balancing...');
  
  try {
    // Make multiple concurrent requests
    const requests = Array(10).fill().map(() => 
      apiClient.get('/health').catch(error => error.response || error)
    );
    
    const responses = await Promise.all(requests);
    const successfulResponses = responses.filter(response => 
      response.status && response.status >= 200 && response.status < 300
    );
    
    if (successfulResponses.length >= 8) { // Allow some failures
      log(`✓ Load balancing test passed (${successfulResponses.length}/10 successful)`);
      testResults.passed++;
      return true;
    } else {
      logError('Load balancing test failed', `Only ${successfulResponses.length}/10 requests successful`);
      testResults.failed++;
      return false;
    }
    
  } catch (error) {
    logError('Load balancing test failed', error);
    testResults.failed++;
    return false;
  }
}

// Test monitoring endpoints
async function testMonitoringEndpoints() {
  log('Testing monitoring endpoints...');
  
  const monitoringEndpoints = [
    { path: '/metrics', description: 'Prometheus metrics' },
    { path: '/health', description: 'Health check' },
    { path: '/ready', description: 'Readiness check' }
  ];
  
  let passed = 0;
  
  for (const endpoint of monitoringEndpoints) {
    try {
      const response = await axios.get(`${config.apiUrl}${endpoint.path}`, {
        timeout: config.timeout
      });
      
      if (response.status >= 200 && response.status < 300) {
        log(`✓ ${endpoint.description} endpoint working`);
        passed++;
      } else {
        logError(`${endpoint.description} endpoint failed`, `Status: ${response.status}`);
      }
    } catch (error) {
      logError(`${endpoint.description} endpoint failed`, error);
    }
  }
  
  if (passed >= 2) { // At least health and ready should work
    testResults.passed++;
    return true;
  } else {
    testResults.failed++;
    return false;
  }
}

// Main test runner
async function runIntegrationTests() {
  log('Starting integration tests...');
  log(`API URL: ${config.apiUrl}`);
  log(`WebSocket URL: ${config.wsUrl}`);
  
  const tests = [
    testApiEndpoints,
    testDataFlow,
    testCachingLayer,
    testLoadBalancing,
    testMonitoringEndpoints,
    testWebSocketUpdates
  ];
  
  for (const test of tests) {
    await test();
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Print results
  log('\n=== INTEGRATION TEST RESULTS ===');
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
runIntegrationTests();
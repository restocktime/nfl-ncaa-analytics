const WebSocket = require('ws');

// Configuration
const config = {
  wsUrl: process.env.PRODUCTION_WS_URL || 'wss://ws.football-analytics.com',
  timeout: 10000
};

// Test WebSocket connection for production
async function testProductionWebSocket() {
  console.log(`[${new Date().toISOString()}] Testing WebSocket connection to ${config.wsUrl}`);
  
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(config.wsUrl);
      let connected = false;
      
      const timeout = setTimeout(() => {
        if (!connected) {
          ws.close();
          console.error(`[${new Date().toISOString()}] WebSocket connection timeout`);
          resolve(false);
        }
      }, config.timeout);
      
      ws.on('open', () => {
        connected = true;
        clearTimeout(timeout);
        console.log(`[${new Date().toISOString()}] ✓ WebSocket connection established`);
        
        // Send ping message
        ws.send(JSON.stringify({ type: 'ping' }));
        
        // Close after successful connection
        setTimeout(() => {
          ws.close();
          console.log(`[${new Date().toISOString()}] ✓ WebSocket test completed successfully`);
          resolve(true);
        }, 1000);
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          console.log(`[${new Date().toISOString()}] Received message:`, message.type);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Message parsing error:`, error.message);
        }
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        console.error(`[${new Date().toISOString()}] WebSocket error:`, error.message);
        resolve(false);
      });
      
      ws.on('close', (code, reason) => {
        if (connected) {
          console.log(`[${new Date().toISOString()}] WebSocket closed normally (${code})`);
        } else {
          clearTimeout(timeout);
          console.error(`[${new Date().toISOString()}] WebSocket closed before connecting (${code}): ${reason}`);
          resolve(false);
        }
      });
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] WebSocket test setup failed:`, error.message);
      resolve(false);
    }
  });
}

// Run the test
testProductionWebSocket().then(success => {
  process.exit(success ? 0 : 1);
});
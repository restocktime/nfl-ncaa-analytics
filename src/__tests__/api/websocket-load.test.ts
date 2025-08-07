import 'reflect-metadata';
import { WebSocketService, MessageType } from '../../api/websocket-service';
import { GameProbabilities, WinProbability, SpreadProbability, TotalProbability } from '../../models/GameProbabilities';

describe('WebSocket Load Tests', () => {
  let webSocketService: WebSocketService;
  const testPort = 8082;

  beforeEach(async () => {
    webSocketService = new WebSocketService(testPort);
    await webSocketService.start();
  });

  afterEach(async () => {
    await webSocketService.stop();
  });

  describe('Concurrent Connection Load Tests', () => {
    it('should handle 100 concurrent connections', async () => {
      const connectionCount = 100;
      const mockClients = [];

      // Create mock clients
      for (let i = 0; i < connectionCount; i++) {
        const clientId = `load-client-${i}`;
        const mockSocket = {
          write: jest.fn(),
          terminate: jest.fn()
        };
        
        const mockClient = {
          id: clientId,
          socket: mockSocket,
          subscriptions: new Set<string>(),
          lastHeartbeat: new Date(),
          isAlive: true,
          metadata: {
            userAgent: `LoadTest-${i}`,
            ipAddress: `192.168.1.${i % 255}`
          }
        };

        webSocketService['clients'].set(clientId, mockClient);
        webSocketService['messageQueue'].set(clientId, []);
        mockClients.push(mockClient);
      }

      // Verify all connections are tracked
      const stats = webSocketService.getStats();
      expect(stats.totalConnections).toBe(connectionCount);
      expect(stats.activeConnections).toBe(connectionCount);
    });

    it('should handle mass subscription events', async () => {
      const clientCount = 50;
      const topicsPerClient = 10;
      const mockClients = [];

      // Create clients
      for (let i = 0; i < clientCount; i++) {
        const clientId = `sub-client-${i}`;
        const mockClient = {
          id: clientId,
          socket: { write: jest.fn() },
          subscriptions: new Set<string>(),
          lastHeartbeat: new Date(),
          isAlive: true,
          metadata: {}
        };

        webSocketService['clients'].set(clientId, mockClient);
        mockClients.push(mockClient);
      }

      // Subscribe each client to multiple topics
      for (let i = 0; i < clientCount; i++) {
        const clientId = `sub-client-${i}`;
        const topics = [];
        
        for (let j = 0; j < topicsPerClient; j++) {
          topics.push(`game:${i * topicsPerClient + j}:probabilities`);
        }

        webSocketService['handleSubscribe'](clientId, { topics, filters: {} });
      }

      const stats = webSocketService.getStats();
      expect(stats.totalSubscriptions).toBe(clientCount * topicsPerClient);
    });

    it('should handle high-frequency message broadcasting', async () => {
      const clientCount = 20;
      const messageCount = 100;
      const gameId = 'load-test-game';
      const topic = `game:${gameId}:probabilities`;

      // Create clients and subscribe them
      for (let i = 0; i < clientCount; i++) {
        const clientId = `broadcast-client-${i}`;
        const mockClient = {
          id: clientId,
          socket: { write: jest.fn() },
          subscriptions: new Set([topic]),
          lastHeartbeat: new Date(),
          isAlive: true,
          metadata: {}
        };

        webSocketService['clients'].set(clientId, mockClient);
        
        if (!webSocketService['subscriptions'].has(topic)) {
          webSocketService['subscriptions'].set(topic, new Set());
        }
        webSocketService['subscriptions'].get(topic)!.add(clientId);
      }

      // Create test probabilities
      const probabilities = new GameProbabilities({
        gameId,
        timestamp: new Date(),
        winProbability: new WinProbability({ home: 0.55, away: 0.45 }),
        spreadProbability: new SpreadProbability({ spread: -3.5, probability: 0.52, confidence: 0.85 }),
        totalProbability: new TotalProbability({ over: 0.48, under: 0.52, total: 47.5 }),
        playerProps: []
      });

      // Measure broadcast performance
      const startTime = Date.now();
      
      const broadcastPromises = [];
      for (let i = 0; i < messageCount; i++) {
        broadcastPromises.push(
          webSocketService.broadcastProbabilityUpdate(gameId, probabilities)
        );
      }

      await Promise.all(broadcastPromises);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const messagesPerSecond = (messageCount * clientCount * 1000) / totalTime;

      console.log(`Broadcast performance: ${messagesPerSecond.toFixed(0)} messages/second`);
      
      // Should handle at least 1000 messages per second
      expect(messagesPerSecond).toBeGreaterThan(1000);
    });

    it('should handle connection churn (connects/disconnects)', async () => {
      const churnCycles = 50;
      const connectionsPerCycle = 10;

      for (let cycle = 0; cycle < churnCycles; cycle++) {
        const clients = [];

        // Connect clients
        for (let i = 0; i < connectionsPerCycle; i++) {
          const clientId = `churn-client-${cycle}-${i}`;
          const mockClient = {
            id: clientId,
            socket: { write: jest.fn(), terminate: jest.fn() },
            subscriptions: new Set<string>(),
            lastHeartbeat: new Date(),
            isAlive: true,
            metadata: {}
          };

          webSocketService['clients'].set(clientId, mockClient);
          webSocketService['messageQueue'].set(clientId, []);
          clients.push(clientId);
        }

        // Subscribe to topics
        clients.forEach(clientId => {
          webSocketService['handleSubscribe'](clientId, {
            topics: [`game:${cycle}:probabilities`],
            filters: {}
          });
        });

        // Disconnect all clients
        clients.forEach(clientId => {
          webSocketService['handleDisconnect'](clientId);
        });
      }

      // All clients should be cleaned up
      const stats = webSocketService.getStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.totalSubscriptions).toBe(0);
    });

    it('should handle memory pressure with message queuing', async () => {
      const clientCount = 10;
      const messagesPerClient = 50;

      // Create clients with failing sockets (to trigger queuing)
      for (let i = 0; i < clientCount; i++) {
        const clientId = `queue-client-${i}`;
        const mockSocket = {
          write: jest.fn().mockImplementation(() => {
            throw new Error('Socket write failed');
          })
        };
        
        const mockClient = {
          id: clientId,
          socket: mockSocket,
          subscriptions: new Set<string>(),
          lastHeartbeat: new Date(),
          isAlive: true,
          metadata: {}
        };

        webSocketService['clients'].set(clientId, mockClient);
        webSocketService['messageQueue'].set(clientId, []);
      }

      // Send messages to trigger queuing
      for (let i = 0; i < clientCount; i++) {
        const clientId = `queue-client-${i}`;
        
        for (let j = 0; j < messagesPerClient; j++) {
          webSocketService['sendMessage'](clientId, {
            type: MessageType.HEARTBEAT,
            payload: { test: `message-${j}` },
            timestamp: new Date(),
            messageId: `test-${i}-${j}`
          });
        }
      }

      const stats = webSocketService.getStats();
      
      // Should have queued messages but respect limits
      expect(stats.queuedMessages).toBeGreaterThan(0);
      expect(stats.queuedMessages).toBeLessThanOrEqual(clientCount * 100); // Queue limit
    });

    it('should maintain performance under sustained load', async () => {
      const duration = 5000; // 5 seconds
      const clientCount = 30;
      const gameId = 'sustained-load-game';
      
      // Setup clients
      for (let i = 0; i < clientCount; i++) {
        const clientId = `sustained-client-${i}`;
        const mockClient = {
          id: clientId,
          socket: { write: jest.fn() },
          subscriptions: new Set([`game:${gameId}:probabilities`]),
          lastHeartbeat: new Date(),
          isAlive: true,
          metadata: {}
        };

        webSocketService['clients'].set(clientId, mockClient);
        
        const topic = `game:${gameId}:probabilities`;
        if (!webSocketService['subscriptions'].has(topic)) {
          webSocketService['subscriptions'].set(topic, new Set());
        }
        webSocketService['subscriptions'].get(topic)!.add(clientId);
      }

      const probabilities = new GameProbabilities({
        gameId,
        timestamp: new Date(),
        winProbability: new WinProbability({ home: 0.6, away: 0.4 }),
        spreadProbability: new SpreadProbability({ spread: -2.5, probability: 0.58, confidence: 0.9 }),
        totalProbability: new TotalProbability({ over: 0.52, under: 0.48, total: 45.5 }),
        playerProps: []
      });

      let messagesSent = 0;
      const startTime = Date.now();
      
      // Send messages continuously for the duration
      const sendInterval = setInterval(async () => {
        await webSocketService.broadcastProbabilityUpdate(gameId, probabilities);
        messagesSent++;
      }, 100); // Every 100ms

      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, duration));
      clearInterval(sendInterval);

      const endTime = Date.now();
      const actualDuration = endTime - startTime;
      const messagesPerSecond = (messagesSent * 1000) / actualDuration;

      console.log(`Sustained load: ${messagesPerSecond.toFixed(1)} broadcasts/second over ${actualDuration}ms`);
      
      // Should maintain at least 5 broadcasts per second
      expect(messagesPerSecond).toBeGreaterThan(5);
      expect(messagesSent).toBeGreaterThan(0);
    });
  });

  describe('Resource Management Load Tests', () => {
    it('should handle heartbeat timeouts under load', async () => {
      const clientCount = 20;
      const timeoutClients = 5;

      // Create mix of active and timeout clients
      for (let i = 0; i < clientCount; i++) {
        const clientId = `heartbeat-client-${i}`;
        const isTimeoutClient = i < timeoutClients;
        
        const mockClient = {
          id: clientId,
          socket: { write: jest.fn(), terminate: jest.fn() },
          subscriptions: new Set<string>(),
          lastHeartbeat: isTimeoutClient 
            ? new Date(Date.now() - 60000) // 1 minute ago (timeout)
            : new Date(), // Current time (active)
          isAlive: !isTimeoutClient,
          metadata: {}
        };

        webSocketService['clients'].set(clientId, mockClient);
      }

      // Simulate heartbeat check
      const initialStats = webSocketService.getStats();
      expect(initialStats.totalConnections).toBe(clientCount);
      expect(initialStats.activeConnections).toBe(clientCount - timeoutClients);
    });

    it('should clean up subscriptions efficiently', async () => {
      const topicCount = 100;
      const clientsPerTopic = 5;
      
      // Create topics with multiple subscribers
      for (let topicId = 0; topicId < topicCount; topicId++) {
        const topic = `game:${topicId}:probabilities`;
        
        for (let clientId = 0; clientId < clientsPerTopic; clientId++) {
          const id = `cleanup-client-${topicId}-${clientId}`;
          const mockClient = {
            id,
            socket: { write: jest.fn() },
            subscriptions: new Set([topic]),
            lastHeartbeat: new Date(),
            isAlive: true,
            metadata: {}
          };

          webSocketService['clients'].set(id, mockClient);
          
          if (!webSocketService['subscriptions'].has(topic)) {
            webSocketService['subscriptions'].set(topic, new Set());
          }
          webSocketService['subscriptions'].get(topic)!.add(id);
        }
      }

      const initialStats = webSocketService.getStats();
      expect(initialStats.totalSubscriptions).toBe(topicCount * clientsPerTopic);

      // Disconnect all clients
      const allClientIds = Array.from(webSocketService['clients'].keys());
      allClientIds.forEach(clientId => {
        webSocketService['handleDisconnect'](clientId);
      });

      const finalStats = webSocketService.getStats();
      expect(finalStats.totalConnections).toBe(0);
      expect(finalStats.totalSubscriptions).toBe(0);
    });
  });
});
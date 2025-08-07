import 'reflect-metadata';
import { WebSocketService, MessageType, WebSocketMessage } from '../../api/websocket-service';
import { GameProbabilities, WinProbability, SpreadProbability, TotalProbability } from '../../models/GameProbabilities';
import { SimulationResult, OutcomeDistribution, ConfidenceInterval } from '../../models/SimulationResult';
import { GameState } from '../../models/GameState';

describe('WebSocketService', () => {
  let webSocketService: WebSocketService;
  const testPort = 8081;

  beforeEach(() => {
    webSocketService = new WebSocketService(testPort);
  });

  afterEach(async () => {
    await webSocketService.stop();
  });

  describe('Server Lifecycle', () => {
    it('should start and stop the server successfully', async () => {
      await webSocketService.start();
      expect(webSocketService['isRunning']).toBe(true);
      
      await webSocketService.stop();
      expect(webSocketService['isRunning']).toBe(false);
    });

    it('should throw error when starting already running server', async () => {
      await webSocketService.start();
      
      await expect(webSocketService.start()).rejects.toThrow('WebSocket service is already running');
    });

    it('should handle multiple start/stop cycles', async () => {
      await webSocketService.start();
      await webSocketService.stop();
      
      await webSocketService.start();
      expect(webSocketService['isRunning']).toBe(true);
      
      await webSocketService.stop();
      expect(webSocketService['isRunning']).toBe(false);
    });
  });

  describe('Connection Management', () => {
    beforeEach(async () => {
      await webSocketService.start();
    });

    it('should generate unique client IDs', () => {
      const id1 = webSocketService['generateClientId']();
      const id2 = webSocketService['generateClientId']();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^client_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^client_\d+_[a-z0-9]+$/);
    });

    it('should generate unique message IDs', () => {
      const id1 = webSocketService['generateMessageId']();
      const id2 = webSocketService['generateMessageId']();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^msg_\d+_[a-z0-9]+$/);
    });

    it('should track connection statistics', () => {
      const stats = webSocketService.getStats();
      
      expect(stats).toMatchObject({
        totalConnections: 0,
        activeConnections: 0,
        totalSubscriptions: 0,
        queuedMessages: 0
      });
    });
  });

  describe('Message Broadcasting', () => {
    beforeEach(async () => {
      await webSocketService.start();
    });

    it('should broadcast probability updates', async () => {
      const gameId = 'test-game-123';
      const probabilities = new GameProbabilities({
        gameId,
        timestamp: new Date(),
        winProbability: new WinProbability({ home: 0.6, away: 0.4 }),
        spreadProbability: new SpreadProbability({ spread: -3.5, probability: 0.55, confidence: 0.85 }),
        totalProbability: new TotalProbability({ over: 0.45, under: 0.55, total: 47.5 }),
        playerProps: []
      });

      // Should not throw error even with no subscribers
      await expect(webSocketService.broadcastProbabilityUpdate(gameId, probabilities))
        .resolves.not.toThrow();
    });

    it('should broadcast game state updates', async () => {
      const gameId = 'test-game-456';
      const gameState = {} as GameState; // Mock game state

      await expect(webSocketService.broadcastGameStateUpdate(gameId, gameState))
        .resolves.not.toThrow();
    });

    it('should broadcast prediction completion', async () => {
      const scenarioId = 'test-scenario-789';
      const result = new SimulationResult({
        scenarioId,
        iterations: 1000,
        outcomes: new OutcomeDistribution({
          mean: 0.55,
          median: 0.54,
          standardDeviation: 0.12,
          percentile25: 0.45,
          percentile75: 0.65,
          minimum: 0.2,
          maximum: 0.9
        }),
        confidenceInterval: new ConfidenceInterval({ lower: 0.4, upper: 0.7, confidenceLevel: 0.95 }),
        keyFactors: [],
        executionTime: 150
      });

      await expect(webSocketService.broadcastPredictionComplete(scenarioId, result))
        .resolves.not.toThrow();
    });
  });

  describe('WebSocket Frame Parsing', () => {
    beforeEach(async () => {
      await webSocketService.start();
    });

    it('should parse simple text frames', () => {
      // Create a simple WebSocket text frame
      const text = 'Hello World';
      const payload = Buffer.from(text, 'utf8');
      const frame = Buffer.allocUnsafe(2 + payload.length);
      
      frame[0] = 0x81; // FIN + text frame
      frame[1] = 0x80 | payload.length; // MASK + payload length
      
      // Add mask key (4 bytes)
      const maskKey = Buffer.from([0x12, 0x34, 0x56, 0x78]);
      const frameWithMask = Buffer.concat([
        frame.slice(0, 2),
        maskKey,
        payload
      ]);
      
      // Apply mask to payload
      for (let i = 0; i < payload.length; i++) {
        frameWithMask[6 + i] ^= maskKey[i % 4];
      }

      const result = webSocketService['parseWebSocketFrame'](frameWithMask);
      expect(result).toBe(text);
    });

    it('should handle invalid frames gracefully', () => {
      const invalidFrame = Buffer.from([0x81]); // Too short
      const result = webSocketService['parseWebSocketFrame'](invalidFrame);
      expect(result).toBeNull();
    });

    it('should handle empty frames', () => {
      const emptyFrame = Buffer.from([0x81, 0x80, 0x12, 0x34, 0x56, 0x78]); // Empty masked frame
      const result = webSocketService['parseWebSocketFrame'](emptyFrame);
      expect(result).toBe('');
    });
  });

  describe('Message Types', () => {
    it('should define all required message types', () => {
      expect(MessageType.SUBSCRIBE).toBe('subscribe');
      expect(MessageType.UNSUBSCRIBE).toBe('unsubscribe');
      expect(MessageType.PROBABILITY_UPDATE).toBe('probability_update');
      expect(MessageType.GAME_STATE_UPDATE).toBe('game_state_update');
      expect(MessageType.PREDICTION_COMPLETE).toBe('prediction_complete');
      expect(MessageType.ERROR).toBe('error');
      expect(MessageType.HEARTBEAT).toBe('heartbeat');
      expect(MessageType.CONNECTION_ACK).toBe('connection_ack');
    });

    it('should create valid WebSocket messages', () => {
      const message: WebSocketMessage = {
        type: MessageType.PROBABILITY_UPDATE,
        payload: { gameId: 'test-123', data: 'test-data' },
        timestamp: new Date(),
        messageId: 'test-message-id'
      };

      expect(message.type).toBe(MessageType.PROBABILITY_UPDATE);
      expect(message.payload).toBeDefined();
      expect(message.timestamp).toBeInstanceOf(Date);
      expect(message.messageId).toBe('test-message-id');
    });
  });

  describe('Subscription Management', () => {
    beforeEach(async () => {
      await webSocketService.start();
    });

    it('should handle subscription requests', () => {
      const clientId = 'test-client-1';
      const mockClient = {
        id: clientId,
        socket: { write: jest.fn() },
        subscriptions: new Set<string>(),
        lastHeartbeat: new Date(),
        isAlive: true,
        metadata: {}
      };

      webSocketService['clients'].set(clientId, mockClient);

      const payload = {
        topics: ['game:123:probabilities', 'game:456:state'],
        filters: {}
      };

      webSocketService['handleSubscribe'](clientId, payload);

      expect(mockClient.subscriptions.has('game:123:probabilities')).toBe(true);
      expect(mockClient.subscriptions.has('game:456:state')).toBe(true);
      expect(webSocketService['subscriptions'].get('game:123:probabilities')?.has(clientId)).toBe(true);
    });

    it('should handle unsubscription requests', () => {
      const clientId = 'test-client-2';
      const mockClient = {
        id: clientId,
        socket: { write: jest.fn() },
        subscriptions: new Set(['game:123:probabilities', 'game:456:state']),
        lastHeartbeat: new Date(),
        isAlive: true,
        metadata: {}
      };

      webSocketService['clients'].set(clientId, mockClient);
      webSocketService['subscriptions'].set('game:123:probabilities', new Set([clientId]));
      webSocketService['subscriptions'].set('game:456:state', new Set([clientId]));

      const payload = { topics: ['game:123:probabilities'] };
      webSocketService['handleUnsubscribe'](clientId, payload);

      expect(mockClient.subscriptions.has('game:123:probabilities')).toBe(false);
      expect(mockClient.subscriptions.has('game:456:state')).toBe(true);
      expect(webSocketService['subscriptions'].get('game:123:probabilities')?.has(clientId)).toBe(false);
    });
  });

  describe('Heartbeat Management', () => {
    beforeEach(async () => {
      await webSocketService.start();
    });

    it('should handle heartbeat messages', () => {
      const clientId = 'test-client-3';
      const initialTime = new Date(Date.now() - 10000); // 10 seconds ago
      const mockClient = {
        id: clientId,
        socket: { write: jest.fn() },
        subscriptions: new Set<string>(),
        lastHeartbeat: initialTime,
        isAlive: false,
        metadata: {}
      };

      webSocketService['clients'].set(clientId, mockClient);

      webSocketService['handleHeartbeat'](clientId);

      expect(mockClient.isAlive).toBe(true);
      expect(mockClient.lastHeartbeat.getTime()).toBeGreaterThan(initialTime.getTime());
    });

    it('should update client heartbeat timestamp', () => {
      const clientId = 'test-client-4';
      const oldTimestamp = new Date(Date.now() - 5000);
      const mockClient = {
        id: clientId,
        socket: { write: jest.fn() },
        subscriptions: new Set<string>(),
        lastHeartbeat: oldTimestamp,
        isAlive: true,
        metadata: {}
      };

      webSocketService['clients'].set(clientId, mockClient);

      webSocketService['handleHeartbeat'](clientId);

      expect(mockClient.lastHeartbeat.getTime()).toBeGreaterThan(oldTimestamp.getTime());
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await webSocketService.start();
    });

    it('should handle client disconnection gracefully', () => {
      const clientId = 'test-client-5';
      const mockClient = {
        id: clientId,
        socket: { write: jest.fn() },
        subscriptions: new Set(['game:123:probabilities']),
        lastHeartbeat: new Date(),
        isAlive: true,
        metadata: {}
      };

      webSocketService['clients'].set(clientId, mockClient);
      webSocketService['subscriptions'].set('game:123:probabilities', new Set([clientId]));
      webSocketService['messageQueue'].set(clientId, []);

      webSocketService['handleDisconnect'](clientId);

      expect(webSocketService['clients'].has(clientId)).toBe(false);
      expect(webSocketService['messageQueue'].has(clientId)).toBe(false);
      expect(webSocketService['subscriptions'].get('game:123:probabilities')?.has(clientId)).toBe(false);
    });

    it('should send error messages to clients', () => {
      const clientId = 'test-client-6';
      const mockSocket = { write: jest.fn() };
      const mockClient = {
        id: clientId,
        socket: mockSocket,
        subscriptions: new Set<string>(),
        lastHeartbeat: new Date(),
        isAlive: true,
        metadata: {}
      };

      webSocketService['clients'].set(clientId, mockClient);

      webSocketService['sendError'](clientId, 'Test error message');

      expect(mockSocket.write).toHaveBeenCalled();
    });
  });

  describe('Performance and Load Testing', () => {
    beforeEach(async () => {
      await webSocketService.start();
    });

    it('should handle multiple concurrent connections', () => {
      const clientCount = 100;
      const clients = [];

      for (let i = 0; i < clientCount; i++) {
        const clientId = `load-test-client-${i}`;
        const mockClient = {
          id: clientId,
          socket: { write: jest.fn() },
          subscriptions: new Set<string>(),
          lastHeartbeat: new Date(),
          isAlive: true,
          metadata: {}
        };
        
        webSocketService['clients'].set(clientId, mockClient);
        clients.push(mockClient);
      }

      const stats = webSocketService.getStats();
      expect(stats.totalConnections).toBe(clientCount);
    });

    it('should handle message queue limits', () => {
      const clientId = 'queue-test-client';
      webSocketService['messageQueue'].set(clientId, []);
      
      // Add messages to queue (simulating failed sends)
      const queue = webSocketService['messageQueue'].get(clientId)!;
      for (let i = 0; i < 150; i++) { // More than the 100 limit
        queue.push({
          type: MessageType.HEARTBEAT,
          timestamp: new Date(),
          messageId: `test-${i}`
        });
      }

      // The queue should be limited to prevent memory issues
      expect(queue.length).toBeLessThanOrEqual(150);
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(async () => {
      await webSocketService.start();
    });

    it('should handle complete client lifecycle', () => {
      const clientId = 'lifecycle-test-client';
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
          userAgent: 'Test Browser',
          ipAddress: '127.0.0.1'
        }
      };

      // Simulate connection
      webSocketService['clients'].set(clientId, mockClient);
      webSocketService['messageQueue'].set(clientId, []);

      // Simulate subscription
      webSocketService['handleSubscribe'](clientId, {
        topics: ['game:123:probabilities'],
        filters: {}
      });

      // Simulate heartbeat
      webSocketService['handleHeartbeat'](clientId);

      // Simulate disconnection
      webSocketService['handleDisconnect'](clientId);

      expect(webSocketService['clients'].has(clientId)).toBe(false);
    });
  });
});
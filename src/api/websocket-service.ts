import { GameProbabilities } from '../models/GameProbabilities';
import { SimulationResult } from '../models/SimulationResult';
import { GameState } from '../models/GameState';

/**
 * WebSocket message types for real-time communication
 */
export enum MessageType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  PROBABILITY_UPDATE = 'probability_update',
  GAME_STATE_UPDATE = 'game_state_update',
  PREDICTION_COMPLETE = 'prediction_complete',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat',
  CONNECTION_ACK = 'connection_ack'
}

export interface WebSocketMessage {
  type: MessageType;
  payload?: any;
  timestamp: Date;
  messageId: string;
}

export interface ClientConnection {
  id: string;
  socket: any;
  subscriptions: Set<string>;
  lastHeartbeat: Date;
  isAlive: boolean;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    userId?: string;
  };
}

export interface SubscriptionFilter {
  gameIds?: string[];
  teamIds?: string[];
  playerIds?: string[];
  eventTypes?: string[];
}

/**
 * WebSocket service for real-time probability updates and game events
 */
export class WebSocketService {
  private server: any;
  private clients: Map<string, ClientConnection> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // topic -> client IDs
  private messageQueue: Map<string, WebSocketMessage[]> = new Map(); // client ID -> queued messages
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private port: number;
  private isRunning: boolean = false;

  constructor(port: number = 8080) {
    this.port = port;
  }

  /**
   * Start the WebSocket server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('WebSocket service is already running');
    }

    // Create WebSocket server using Node.js built-in modules
    const http = require('http');
    const crypto = require('crypto');

    const server = http.createServer();
    
    server.on('upgrade', (request: any, socket: any, head: any) => {
      this.handleUpgrade(request, socket, head);
    });

    return new Promise((resolve, reject) => {
      server.listen(this.port, (err: any) => {
        if (err) {
          reject(err);
        } else {
          this.server = server;
          this.isRunning = true;
          this.startHeartbeat();
          this.startCleanup();
          console.log(`WebSocket service started on port ${this.port}`);
          resolve();
        }
      });
    });
  }

  /**
   * Stop the WebSocket server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      return;
    }

    // Stop intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      client.socket.terminate();
    }
    this.clients.clear();
    this.subscriptions.clear();
    this.messageQueue.clear();

    return new Promise((resolve) => {
      this.server.close(() => {
        this.isRunning = false;
        console.log('WebSocket service stopped');
        resolve();
      });
    });
  }

  /**
   * Handle WebSocket upgrade request
   */
  private handleUpgrade(request: any, socket: any, head: any): void {
    const crypto = require('crypto');
    
    // WebSocket handshake
    const key = request.headers['sec-websocket-key'];
    if (!key) {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    const responseHeaders = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '\r\n'
    ].join('\r\n');

    socket.write(responseHeaders);

    // Create client connection
    const clientId = this.generateClientId();
    const client: ClientConnection = {
      id: clientId,
      socket,
      subscriptions: new Set(),
      lastHeartbeat: new Date(),
      isAlive: true,
      metadata: {
        userAgent: request.headers['user-agent'],
        ipAddress: request.connection.remoteAddress,
      }
    };

    this.clients.set(clientId, client);
    this.messageQueue.set(clientId, []);

    // Set up socket event handlers
    socket.on('data', (data: Buffer) => {
      this.handleMessage(clientId, data);
    });

    socket.on('close', () => {
      this.handleDisconnect(clientId);
    });

    socket.on('error', (error: Error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.handleDisconnect(clientId);
    });

    // Send connection acknowledgment
    this.sendMessage(clientId, {
      type: MessageType.CONNECTION_ACK,
      payload: { clientId },
      timestamp: new Date(),
      messageId: this.generateMessageId()
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(clientId: string, data: Buffer): void {
    try {
      const message = this.parseWebSocketFrame(data);
      if (!message) return;

      const parsedMessage: WebSocketMessage = JSON.parse(message);
      
      switch (parsedMessage.type) {
        case MessageType.SUBSCRIBE:
          this.handleSubscribe(clientId, parsedMessage.payload);
          break;
        case MessageType.UNSUBSCRIBE:
          this.handleUnsubscribe(clientId, parsedMessage.payload);
          break;
        case MessageType.HEARTBEAT:
          this.handleHeartbeat(clientId);
          break;
        default:
          this.sendError(clientId, `Unknown message type: ${parsedMessage.type}`);
      }
    } catch (error) {
      console.error(`Error handling message from client ${clientId}:`, error);
      this.sendError(clientId, 'Invalid message format');
    }
  }

  /**
   * Parse WebSocket frame (simplified implementation)
   */
  private parseWebSocketFrame(buffer: Buffer): string | null {
    if (buffer.length < 2) return null;

    const firstByte = buffer[0];
    const secondByte = buffer[1];
    
    const opcode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) === 0x80;
    let payloadLength = secondByte & 0x7f;
    
    let offset = 2;
    
    if (payloadLength === 126) {
      payloadLength = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      // For simplicity, we don't handle 64-bit lengths
      return null;
    }

    let maskKey: Buffer | null = null;
    if (masked) {
      maskKey = buffer.slice(offset, offset + 4);
      offset += 4;
    }

    const payload = buffer.slice(offset, offset + payloadLength);
    
    if (masked && maskKey) {
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= maskKey[i % 4];
      }
    }

    return payload.toString('utf8');
  }

  /**
   * Send WebSocket frame
   */
  private sendWebSocketFrame(socket: any, data: string): void {
    const payload = Buffer.from(data, 'utf8');
    const payloadLength = payload.length;
    
    let frame: Buffer;
    
    if (payloadLength < 126) {
      frame = Buffer.allocUnsafe(2 + payloadLength);
      frame[0] = 0x81; // FIN + text frame
      frame[1] = payloadLength;
      payload.copy(frame, 2);
    } else if (payloadLength < 65536) {
      frame = Buffer.allocUnsafe(4 + payloadLength);
      frame[0] = 0x81;
      frame[1] = 126;
      frame.writeUInt16BE(payloadLength, 2);
      payload.copy(frame, 4);
    } else {
      // For simplicity, we don't handle large payloads
      return;
    }
    
    socket.write(frame);
  }

  /**
   * Handle client subscription
   */
  private handleSubscribe(clientId: string, payload: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { topics, filters } = payload;
    
    if (Array.isArray(topics)) {
      topics.forEach((topic: string) => {
        client.subscriptions.add(topic);
        
        if (!this.subscriptions.has(topic)) {
          this.subscriptions.set(topic, new Set());
        }
        this.subscriptions.get(topic)!.add(clientId);
      });
    }

    // Send acknowledgment
    this.sendMessage(clientId, {
      type: MessageType.CONNECTION_ACK,
      payload: { subscribed: Array.from(client.subscriptions) },
      timestamp: new Date(),
      messageId: this.generateMessageId()
    });
  }

  /**
   * Handle client unsubscription
   */
  private handleUnsubscribe(clientId: string, payload: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { topics } = payload;
    
    if (Array.isArray(topics)) {
      topics.forEach((topic: string) => {
        client.subscriptions.delete(topic);
        
        const topicSubscribers = this.subscriptions.get(topic);
        if (topicSubscribers) {
          topicSubscribers.delete(clientId);
          if (topicSubscribers.size === 0) {
            this.subscriptions.delete(topic);
          }
        }
      });
    }
  }

  /**
   * Handle heartbeat from client
   */
  private handleHeartbeat(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastHeartbeat = new Date();
      client.isAlive = true;
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all subscriptions
    client.subscriptions.forEach(topic => {
      const topicSubscribers = this.subscriptions.get(topic);
      if (topicSubscribers) {
        topicSubscribers.delete(clientId);
        if (topicSubscribers.size === 0) {
          this.subscriptions.delete(topic);
        }
      }
    });

    // Clean up
    this.clients.delete(clientId);
    this.messageQueue.delete(clientId);
  }

  /**
   * Send message to specific client
   */
  private sendMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const data = JSON.stringify(message);
      this.sendWebSocketFrame(client.socket, data);
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
      // Queue message for retry
      const queue = this.messageQueue.get(clientId);
      if (queue && queue.length < 100) { // Limit queue size
        queue.push(message);
      }
    }
  }

  /**
   * Send error message to client
   */
  private sendError(clientId: string, errorMessage: string): void {
    this.sendMessage(clientId, {
      type: MessageType.ERROR,
      payload: { error: errorMessage },
      timestamp: new Date(),
      messageId: this.generateMessageId()
    });
  }

  /**
   * Broadcast probability update to subscribed clients
   */
  async broadcastProbabilityUpdate(gameId: string, probabilities: GameProbabilities): Promise<void> {
    const topic = `game:${gameId}:probabilities`;
    const subscribers = this.subscriptions.get(topic);
    
    if (!subscribers || subscribers.size === 0) return;

    const message: WebSocketMessage = {
      type: MessageType.PROBABILITY_UPDATE,
      payload: { gameId, probabilities },
      timestamp: new Date(),
      messageId: this.generateMessageId()
    };

    const promises = Array.from(subscribers).map(clientId => {
      return new Promise<void>((resolve) => {
        this.sendMessage(clientId, message);
        resolve();
      });
    });

    await Promise.all(promises);
  }

  /**
   * Broadcast game state update to subscribed clients
   */
  async broadcastGameStateUpdate(gameId: string, gameState: GameState): Promise<void> {
    const topic = `game:${gameId}:state`;
    const subscribers = this.subscriptions.get(topic);
    
    if (!subscribers || subscribers.size === 0) return;

    const message: WebSocketMessage = {
      type: MessageType.GAME_STATE_UPDATE,
      payload: { gameId, gameState },
      timestamp: new Date(),
      messageId: this.generateMessageId()
    };

    const promises = Array.from(subscribers).map(clientId => {
      return new Promise<void>((resolve) => {
        this.sendMessage(clientId, message);
        resolve();
      });
    });

    await Promise.all(promises);
  }

  /**
   * Broadcast prediction completion to subscribed clients
   */
  async broadcastPredictionComplete(scenarioId: string, result: SimulationResult): Promise<void> {
    const topic = `prediction:${scenarioId}`;
    const subscribers = this.subscriptions.get(topic);
    
    if (!subscribers || subscribers.size === 0) return;

    const message: WebSocketMessage = {
      type: MessageType.PREDICTION_COMPLETE,
      payload: { scenarioId, result },
      timestamp: new Date(),
      messageId: this.generateMessageId()
    };

    const promises = Array.from(subscribers).map(clientId => {
      return new Promise<void>((resolve) => {
        this.sendMessage(clientId, message);
        resolve();
      });
    });

    await Promise.all(promises);
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeout = 30000; // 30 seconds

      for (const [clientId, client] of this.clients.entries()) {
        if (now.getTime() - client.lastHeartbeat.getTime() > timeout) {
          console.log(`Client ${clientId} heartbeat timeout, disconnecting`);
          client.socket.terminate();
          this.handleDisconnect(clientId);
        }
      }
    }, 15000); // Check every 15 seconds
  }

  /**
   * Start cleanup process for stale connections
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      // Process queued messages
      for (const [clientId, queue] of this.messageQueue.entries()) {
        if (queue.length > 0) {
          const client = this.clients.get(clientId);
          if (client) {
            const message = queue.shift();
            if (message) {
              this.sendMessage(clientId, message);
            }
          }
        }
      }
    }, 5000); // Every 5 seconds
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    totalSubscriptions: number;
    queuedMessages: number;
  } {
    const queuedMessages = Array.from(this.messageQueue.values())
      .reduce((total, queue) => total + queue.length, 0);

    return {
      totalConnections: this.clients.size,
      activeConnections: Array.from(this.clients.values())
        .filter(client => client.isAlive).length,
      totalSubscriptions: Array.from(this.subscriptions.values())
        .reduce((total, subscribers) => total + subscribers.size, 0),
      queuedMessages
    };
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
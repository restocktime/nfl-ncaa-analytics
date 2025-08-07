import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { demoDataSeeder } from './demo/demo-data-seeder';

/**
 * Simple development server for local testing
 * Runs without external dependencies for quick demo
 */
class DevServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  private port: number = 3000;
  private wsPort: number = 8080;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('frontend/dist'));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Football Analytics API',
        version: '1.0.0'
      });
    });

    // Ready check
    this.app.get('/ready', (req, res) => {
      res.json({
        ready: true,
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          cache: 'connected',
          external_apis: 'connected'
        }
      });
    });

    // API Documentation
    this.app.get('/api-docs', (req, res) => {
      res.json({
        title: 'Football Analytics API',
        version: '1.0.0',
        description: 'Real-time football analytics and predictions',
        endpoints: {
          'GET /health': 'Health check',
          'GET /ready': 'Readiness check',
          'GET /api/v1/teams': 'Get all teams',
          'GET /api/v1/games': 'Get all games',
          'GET /api/v1/games/:id': 'Get specific game',
          'GET /api/v1/predictions/:gameId': 'Get game predictions',
          'GET /api/v1/players': 'Get all players'
        }
      });
    });

    // Teams endpoint
    this.app.get('/api/v1/teams', (req, res) => {
      const teams = demoDataSeeder.getTeams();
      res.json({
        success: true,
        data: teams,
        count: teams.length,
        timestamp: new Date().toISOString()
      });
    });

    // Games endpoint
    this.app.get('/api/v1/games', (req, res) => {
      const games = demoDataSeeder.getGames();
      res.json({
        success: true,
        data: games,
        count: games.length,
        timestamp: new Date().toISOString()
      });
    });

    // Specific game endpoint
    this.app.get('/api/v1/games/:id', (req, res) => {
      const games = demoDataSeeder.getGames();
      const game = games.find(g => g.id === req.params.id);
      
      if (!game) {
        return res.status(404).json({
          success: false,
          error: 'Game not found',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: game,
        timestamp: new Date().toISOString()
      });
    });

    // Predictions endpoint
    this.app.get('/api/v1/predictions/:gameId', (req, res) => {
      try {
        const probabilities = demoDataSeeder.generateGameProbabilities(req.params.gameId);
        res.json({
          success: true,
          data: {
            gameId: req.params.gameId,
            probabilities,
            lastUpdated: new Date().toISOString(),
            model: 'ensemble-v1.0',
            confidence: probabilities.confidence
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          error: 'Game not found',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Players endpoint
    this.app.get('/api/v1/players', (req, res) => {
      const players = demoDataSeeder.getPlayers();
      res.json({
        success: true,
        data: players,
        count: players.length,
        timestamp: new Date().toISOString()
      });
    });

    // System status endpoint
    this.app.get('/api/v1/system/status', (req, res) => {
      res.json({
        success: true,
        data: {
          system: 'Football Analytics System',
          status: 'operational',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          services: {
            'api-gateway': 'healthy',
            'websocket-service': 'healthy',
            'probability-engine': 'healthy',
            'data-ingestion': 'healthy',
            'ml-models': 'healthy'
          },
          features: {
            'real-time-updates': true,
            'monte-carlo-simulations': true,
            'ml-predictions': true,
            'historical-analysis': true
          }
        },
        timestamp: new Date().toISOString()
      });
    });

    // Catch-all for frontend
    this.app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'frontend/dist' });
    });
  }

  private setupWebSocket(): void {
    const wsServer = createServer();
    this.wss = new WebSocketServer({ server: wsServer });

    this.wss.on('connection', (ws) => {
      console.log('🔌 New WebSocket connection established');

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to Football Analytics WebSocket',
        timestamp: new Date().toISOString()
      }));

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📨 Received message:', message);

          if (message.type === 'ping') {
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
          } else if (message.type === 'subscribe') {
            ws.send(JSON.stringify({
              type: 'subscription-confirmed',
              channel: message.channel,
              timestamp: new Date().toISOString()
            }));
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });

    // Start sending live updates every 5 seconds
    setInterval(() => {
      const games = demoDataSeeder.getGames();
      games.forEach(game => {
        const update = demoDataSeeder.generateLiveUpdate(game.id);
        
        this.wss.clients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify(update));
          }
        });
      });
    }, 5000);

    wsServer.listen(this.wsPort, () => {
      console.log(`🔌 WebSocket server running on ws://localhost:${this.wsPort}`);
    });
  }

  public async start(): Promise<void> {
    // Seed demo data
    await demoDataSeeder.seedAll();

    // Start HTTP server
    this.server = this.app.listen(this.port, () => {
      console.log('🚀 Football Analytics System - Development Server');
      console.log('================================================');
      console.log(`📊 API Server:     http://localhost:${this.port}`);
      console.log(`🔌 WebSocket:      ws://localhost:${this.wsPort}`);
      console.log('');
      console.log('🔍 Available Endpoints:');
      console.log(`  Health:          http://localhost:${this.port}/health`);
      console.log(`  API Docs:        http://localhost:${this.port}/api-docs`);
      console.log(`  Teams:           http://localhost:${this.port}/api/v1/teams`);
      console.log(`  Games:           http://localhost:${this.port}/api/v1/games`);
      console.log(`  Predictions:     http://localhost:${this.port}/api/v1/predictions/1`);
      console.log(`  System Status:   http://localhost:${this.port}/api/v1/system/status`);
      console.log('');
      console.log('🎉 Ready for connections!');
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
    }
    this.wss.close();
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const devServer = new DevServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    devServer.stop();
    process.exit(0);
  });

  devServer.start().catch(console.error);
}

export { DevServer };
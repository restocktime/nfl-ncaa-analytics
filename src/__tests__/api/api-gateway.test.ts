import 'reflect-metadata';
import { APIGateway } from '../../api/api-gateway';
import { AuthMiddleware, UserRole } from '../../api/middleware/auth-middleware';
import { RateLimitMiddleware } from '../../api/middleware/rate-limit-middleware';

describe('APIGateway', () => {
  let apiGateway: APIGateway;
  let authMiddleware: AuthMiddleware;
  let rateLimitMiddleware: RateLimitMiddleware;
  const testPort = 3001;

  beforeEach(() => {
    apiGateway = new APIGateway(testPort);
    authMiddleware = new AuthMiddleware('test-secret');
    rateLimitMiddleware = new RateLimitMiddleware({
      windowMs: 60000, // 1 minute
      maxRequests: 100
    });
  });

  afterEach(async () => {
    await apiGateway.stop();
  });

  describe('Server Lifecycle', () => {
    it('should start and stop the server successfully', async () => {
      await apiGateway.start();
      expect(apiGateway['isRunning']).toBe(true);
      
      await apiGateway.stop();
      expect(apiGateway['isRunning']).toBe(false);
    });

    it('should throw error when starting already running server', async () => {
      await apiGateway.start();
      
      await expect(apiGateway.start()).rejects.toThrow('API Gateway is already running');
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      await apiGateway.start();
      
      const response = await makeRequest('GET', '/health');
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        status: 'healthy',
        version: '1.0.0',
        services: {
          database: 'connected',
          redis: 'connected',
          influxdb: 'connected'
        }
      });
      expect(response.data.timestamp).toBeDefined();
    });
  });

  describe('API Documentation Endpoint', () => {
    it('should return API documentation', async () => {
      await apiGateway.start();
      
      const response = await makeRequest('GET', '/docs');
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        title: 'Football Analytics API',
        version: '1.0.0',
        description: 'REST API for football analytics and predictions'
      });
      expect(response.data.endpoints).toBeDefined();
    });
  });

  describe('Probabilities Endpoints', () => {
    beforeEach(async () => {
      await apiGateway.start();
    });

    it('should get probabilities for specific game', async () => {
      const gameId = 'test-game-123';
      const response = await makeRequest('GET', `/api/v1/probabilities/${gameId}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        gameId,
        winProbability: {
          home: expect.any(Number),
          away: expect.any(Number)
        },
        spreadProbability: {
          spread: expect.any(Number),
          probability: expect.any(Number),
          confidence: expect.any(Number)
        }
      });
    });

    it('should get all active probabilities', async () => {
      const response = await makeRequest('GET', '/api/v1/probabilities');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Predictions Endpoints', () => {
    beforeEach(async () => {
      await apiGateway.start();
    });

    it('should get predictions for specific game', async () => {
      const gameId = 'test-game-123';
      const response = await makeRequest('GET', `/api/v1/predictions/${gameId}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        scenarioId: gameId,
        iterations: expect.any(Number),
        confidenceInterval: {
          lower: expect.any(Number),
          upper: expect.any(Number)
        },
        executionTime: expect.any(Number)
      });
    });

    it('should create new prediction', async () => {
      const predictionData = {
        gameId: 'test-game-456',
        iterations: 1500,
        modelType: 'ensemble'
      };
      
      const response = await makeRequest('POST', '/api/v1/predictions', predictionData);
      
      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        scenarioId: 'new-prediction',
        iterations: predictionData.iterations
      });
    });
  });

  describe('Historical Data Endpoints', () => {
    beforeEach(async () => {
      await apiGateway.start();
    });

    it('should get historical stats for team', async () => {
      const teamId = 'test-team-123';
      const response = await makeRequest('GET', `/api/v1/historical/${teamId}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return bad request when team ID is missing', async () => {
      const response = await makeRequest('GET', '/api/v1/historical');
      
      expect(response.status).toBe(400);
      expect(response.data.error).toBe('Team ID required for historical data');
    });
  });

  describe('CORS Headers', () => {
    beforeEach(async () => {
      await apiGateway.start();
    });

    it('should include CORS headers in responses', async () => {
      const response = await makeRequest('GET', '/health');
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await makeRequest('OPTIONS', '/api/v1/probabilities');
      
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await apiGateway.start();
    });

    it('should return 404 for unknown endpoints', async () => {
      const response = await makeRequest('GET', '/unknown-endpoint');
      
      expect(response.status).toBe(404);
      expect(response.data.error).toBe('Not Found');
    });

    it('should return 405 for unsupported methods', async () => {
      const response = await makeRequest('DELETE', '/api/v1/probabilities');
      
      expect(response.status).toBe(405);
      expect(response.data.error).toBe('Method Not Allowed');
    });

    it('should handle malformed JSON in POST requests', async () => {
      const response = await makeRawRequest('POST', '/api/v1/predictions', 'invalid-json');
      
      expect(response.status).toBe(500);
      expect(response.data.error).toBe('Internal Server Error');
    });
  });

  // Helper function to make HTTP requests for testing
  async function makeRequest(method: string, path: string, data?: any): Promise<any> {
    const http = require('http');
    const url = require('url');
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: testPort,
        path,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res: any) => {
        let body = '';
        res.on('data', (chunk: any) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const responseData = JSON.parse(body);
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: responseData
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: body
            });
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async function makeRawRequest(method: string, path: string, body: string): Promise<any> {
    const http = require('http');
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: testPort,
        path,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res: any) => {
        let responseBody = '';
        res.on('data', (chunk: any) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          try {
            const responseData = JSON.parse(responseBody);
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: responseData
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: responseBody
            });
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
});
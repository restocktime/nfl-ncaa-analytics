/**
 * OpenAPI 3.0 schema definition for the Football Analytics API
 */
export const openApiSchema = {
  openapi: '3.0.0',
  info: {
    title: 'Football Analytics API',
    version: '1.0.0',
    description: 'REST API for real-time football analytics and predictions',
    contact: {
      name: 'Football Analytics Team',
      email: 'support@footballanalytics.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api.footballanalytics.com',
      description: 'Production server'
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check endpoint',
        description: 'Returns the health status of the API and its dependencies',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/probabilities': {
      get: {
        summary: 'Get all active game probabilities',
        description: 'Returns probability data for all currently active games',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of game probabilities',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/GameProbabilities' }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimited' }
        }
      }
    },
    '/api/v1/probabilities/{gameId}': {
      get: {
        summary: 'Get probabilities for specific game',
        description: 'Returns detailed probability data for a specific game',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'gameId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique identifier for the game'
          }
        ],
        responses: {
          '200': {
            description: 'Game probability data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GameProbabilities' }
              }
            }
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/api/v1/predictions': {
      get: {
        summary: 'Get all predictions',
        description: 'Returns all available predictions and simulation results',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of predictions',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/SimulationResult' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create new prediction',
        description: 'Generate a new prediction based on provided parameters',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PredictionRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Prediction created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SimulationResult' }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'healthy' },
          timestamp: { type: 'string', format: 'date-time' },
          version: { type: 'string', example: '1.0.0' },
          services: {
            type: 'object',
            properties: {
              database: { type: 'string', example: 'connected' },
              redis: { type: 'string', example: 'connected' },
              influxdb: { type: 'string', example: 'connected' }
            }
          }
        }
      },
      GameProbabilities: {
        type: 'object',
        properties: {
          gameId: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          winProbability: {
            type: 'object',
            properties: {
              home: { type: 'number', minimum: 0, maximum: 1 },
              away: { type: 'number', minimum: 0, maximum: 1 }
            }
          },
          spreadProbability: {
            type: 'object',
            properties: {
              spread: { type: 'number' },
              probability: { type: 'number', minimum: 0, maximum: 1 },
              confidence: { type: 'number', minimum: 0, maximum: 1 }
            }
          }
        }
      },
      SimulationResult: {
        type: 'object',
        properties: {
          scenarioId: { type: 'string' },
          iterations: { type: 'integer', minimum: 1 },
          confidenceInterval: {
            type: 'object',
            properties: {
              lower: { type: 'number' },
              upper: { type: 'number' }
            }
          },
          executionTime: { type: 'number', description: 'Execution time in milliseconds' }
        }
      },
      PredictionRequest: {
        type: 'object',
        required: ['gameId'],
        properties: {
          gameId: { type: 'string' },
          iterations: { type: 'integer', minimum: 100, maximum: 10000, default: 1000 },
          modelType: { type: 'string', enum: ['xgboost', 'neural', 'ensemble'] }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    },
    responses: {
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      RateLimited: {
        description: 'Rate limit exceeded',
        headers: {
          'X-RateLimit-Limit': {
            schema: { type: 'integer' },
            description: 'Request limit per time window'
          },
          'X-RateLimit-Remaining': {
            schema: { type: 'integer' },
            description: 'Remaining requests in current window'
          },
          'X-RateLimit-Reset': {
            schema: { type: 'integer' },
            description: 'Time when rate limit resets (Unix timestamp)'
          }
        },
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  }
};
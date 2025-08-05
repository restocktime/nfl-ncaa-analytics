/**
 * Dependency injection container type definitions
 */

export const TYPES = {
  // Core Services
  Logger: Symbol.for('Logger'),
  Config: Symbol.for('Config'),
  
  // Data Services
  DataIngestionService: Symbol.for('DataIngestionService'),
  DataQualityService: Symbol.for('DataQualityService'),
  
  // Processing Services
  ProbabilityEngine: Symbol.for('ProbabilityEngine'),
  MonteCarloService: Symbol.for('MonteCarloService'),
  MLModelService: Symbol.for('MLModelService'),
  HistoricalStatsService: Symbol.for('HistoricalStatsService'),
  
  // API Services
  APIGateway: Symbol.for('APIGateway'),
  WebSocketService: Symbol.for('WebSocketService'),
  RESTAPIService: Symbol.for('RESTAPIService'),
  
  // External API Connectors
  SportsDataIOConnector: Symbol.for('SportsDataIOConnector'),
  ESPNConnector: Symbol.for('ESPNConnector'),
  OddsAPIConnector: Symbol.for('OddsAPIConnector'),
  WeatherAPIConnector: Symbol.for('WeatherAPIConnector'),
  
  // Storage
  RedisClient: Symbol.for('RedisClient'),
  PostgreSQLClient: Symbol.for('PostgreSQLClient'),
  InfluxDBClient: Symbol.for('InfluxDBClient'),
  
  // Utilities
  CircuitBreaker: Symbol.for('CircuitBreaker'),
  RateLimiter: Symbol.for('RateLimiter'),
  DataValidator: Symbol.for('DataValidator'),
  ShapExplainer: Symbol.for('ShapExplainer')
};
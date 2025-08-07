import { DataRetentionConfig } from './influxdb-config';

/**
 * Data retention configuration for different metric types
 * Defines how long different types of data should be kept in InfluxDB
 */

export const productionRetentionConfig: DataRetentionConfig = {
  // Game events (scores, plays, etc.) - kept for 7 days for real-time analysis
  gameEvents: '7d',
  
  // Probability updates - kept for 30 days for model validation and backtesting
  probabilities: '30d',
  
  // Player statistics - kept for 1 year for historical analysis and trends
  playerStats: '365d',
  
  // System performance metrics - kept for 7 days for operational monitoring
  systemMetrics: '7d',
  
  // API performance metrics - kept for 30 days for usage analysis
  apiMetrics: '30d'
};

export const developmentRetentionConfig: DataRetentionConfig = {
  // Shorter retention for development environment
  gameEvents: '1d',
  probabilities: '3d',
  playerStats: '30d',
  systemMetrics: '1d',
  apiMetrics: '3d'
};

export const testRetentionConfig: DataRetentionConfig = {
  // Very short retention for testing
  gameEvents: '1h',
  probabilities: '2h',
  playerStats: '1d',
  systemMetrics: '1h',
  apiMetrics: '2h'
};

/**
 * Get retention configuration based on environment
 */
export function getRetentionConfig(environment?: string): DataRetentionConfig {
  const env = environment || process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionRetentionConfig;
    case 'test':
      return testRetentionConfig;
    case 'development':
    default:
      return developmentRetentionConfig;
  }
}

/**
 * Retention policy definitions for different measurement types
 */
export interface MeasurementRetentionPolicy {
  measurement: string;
  retention: string;
  description: string;
  tags?: string[];
}

export const measurementRetentionPolicies: MeasurementRetentionPolicy[] = [
  {
    measurement: 'game_state',
    retention: '7d',
    description: 'Live game state updates including scores, time, possession',
    tags: ['game_id', 'quarter']
  },
  {
    measurement: 'game_probabilities',
    retention: '30d',
    description: 'Win probabilities, spread predictions, and model outputs',
    tags: ['game_id', 'model_version']
  },
  {
    measurement: 'game_events',
    retention: '7d',
    description: 'Individual game events like plays, penalties, timeouts',
    tags: ['game_id', 'event_type']
  },
  {
    measurement: 'player_stats',
    retention: '365d',
    description: 'Player performance statistics and metrics',
    tags: ['player_id', 'team_id', 'position', 'stat_type']
  },
  {
    measurement: 'system_metrics',
    retention: '7d',
    description: 'System performance metrics like CPU, memory, response times',
    tags: ['service', 'metric_type', 'instance']
  },
  {
    measurement: 'api_metrics',
    retention: '30d',
    description: 'API endpoint performance and usage metrics',
    tags: ['endpoint', 'method', 'status_code']
  }
];

/**
 * Calculate storage requirements based on retention policies
 */
export function calculateStorageRequirements(
  avgPointsPerDay: Record<string, number>
): Record<string, { dailyPoints: number; retentionDays: number; totalPoints: number }> {
  const config = getRetentionConfig();
  const requirements: Record<string, any> = {};

  measurementRetentionPolicies.forEach(policy => {
    const dailyPoints = avgPointsPerDay[policy.measurement] || 0;
    const retentionDays = parseDurationToDays(policy.retention);
    
    requirements[policy.measurement] = {
      dailyPoints,
      retentionDays,
      totalPoints: dailyPoints * retentionDays
    };
  });

  return requirements;
}

function parseDurationToDays(duration: string): number {
  const match = duration.match(/^(\d+)([dhm])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'd': return value;
    case 'h': return Math.ceil(value / 24);
    case 'm': return Math.ceil(value / (24 * 60));
    default: throw new Error(`Unsupported duration unit: ${unit}`);
  }
}
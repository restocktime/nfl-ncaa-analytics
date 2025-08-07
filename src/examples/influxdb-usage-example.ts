/**
 * InfluxDB Usage Example
 * 
 * This example demonstrates how to use the InfluxDB implementation
 * for storing and querying real-time football analytics metrics.
 */

import { MetricsService } from '../core/metrics-service';
import { defaultInfluxDBConfig, defaultDataRetentionConfig } from '../core/influxdb-config';

async function demonstrateInfluxDBUsage() {
  console.log('🏈 Football Analytics InfluxDB Usage Example');
  console.log('==============================================\n');

  // Initialize the metrics service
  const metricsService = new MetricsService(defaultInfluxDBConfig, defaultDataRetentionConfig);
  
  try {
    // Initialize connection
    console.log('1. Initializing InfluxDB connection...');
    await metricsService.initialize();
    console.log('✅ InfluxDB connection established\n');

    // Example 1: Record game state metrics
    console.log('2. Recording game state metrics...');
    await metricsService.recordGameState({
      gameId: 'example-game-1',
      timestamp: new Date(),
      homeScore: 14,
      awayScore: 7,
      quarter: 2,
      timeRemaining: '8:45',
      possession: 'home',
      fieldPosition: 35,
      down: 2,
      yardsToGo: 8
    });
    console.log('✅ Game state recorded\n');

    // Example 2: Record probability metrics
    console.log('3. Recording probability metrics...');
    await metricsService.recordProbabilities({
      gameId: 'example-game-1',
      timestamp: new Date(),
      homeWinProbability: 0.68,
      awayWinProbability: 0.32,
      spreadProbability: 0.55,
      spreadValue: -3.5,
      overProbability: 0.48,
      underProbability: 0.52,
      totalPoints: 47.5,
      modelVersion: 'v1.2.0'
    });
    console.log('✅ Probabilities recorded\n');

    // Example 3: Record player statistics
    console.log('4. Recording player statistics...');
    await metricsService.recordPlayerStat({
      gameId: 'example-game-1',
      playerId: 'player-123',
      playerName: 'John Quarterback',
      position: 'QB',
      teamId: 'team-home',
      timestamp: new Date(),
      statType: 'passing_yards',
      statValue: 275,
      season: 2024,
      week: 8
    });
    console.log('✅ Player statistics recorded\n');

    // Example 4: Record system metrics
    console.log('5. Recording system performance metrics...');
    await metricsService.recordSystemMetric({
      service: 'prediction-engine',
      timestamp: new Date(),
      metricType: 'cpu_usage',
      value: 75.5,
      unit: 'percent',
      tags: { instance: 'pred-1', region: 'us-east-1' }
    });
    console.log('✅ System metrics recorded\n');

    // Example 5: Record API metrics
    console.log('6. Recording API performance metrics...');
    await metricsService.recordApiMetric({
      endpoint: '/api/games/live',
      method: 'GET',
      statusCode: 200,
      responseTime: 125,
      timestamp: new Date(),
      userId: 'user-456',
      userAgent: 'FootballApp/1.0'
    });
    console.log('✅ API metrics recorded\n');

    // Example 6: Batch operations for high-frequency data
    console.log('7. Demonstrating batch operations...');
    const batchGameStates = [];
    for (let i = 0; i < 10; i++) {
      batchGameStates.push({
        gameId: 'example-game-1',
        timestamp: new Date(Date.now() - i * 30000), // Every 30 seconds
        homeScore: 14 + Math.floor(i / 3),
        awayScore: 7 + Math.floor(i / 4),
        quarter: Math.min(Math.floor(i / 3) + 2, 4)
      });
    }
    await metricsService.recordGameStates(batchGameStates);
    console.log('✅ Batch game states recorded\n');

    // Example 7: Flush data to ensure it's written
    console.log('8. Flushing data to InfluxDB...');
    await metricsService.flush();
    console.log('✅ Data flushed\n');

    // Example 8: Query data for dashboard
    console.log('9. Querying data for real-time dashboard...');
    
    // Wait a moment for data to be available
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const gameStateHistory = await metricsService.getGameStateHistory('example-game-1', '-5m');
    console.log(`📊 Retrieved ${gameStateHistory.length} game state records`);
    
    const probabilityHistory = await metricsService.getProbabilityHistory('example-game-1', '-5m');
    console.log(`📊 Retrieved ${probabilityHistory.length} probability records`);
    
    const latestGameState = await metricsService.getLatestGameState('example-game-1');
    console.log(`📊 Latest game state:`, latestGameState ? 'Found' : 'Not found');
    
    console.log('✅ Dashboard queries completed\n');

    // Example 9: Comprehensive dashboard data
    console.log('10. Retrieving comprehensive dashboard data...');
    const dashboardData = await metricsService.getDashboardData(['example-game-1'], '-10m');
    console.log(`📊 Dashboard data retrieved:`);
    console.log(`   - Game states: ${dashboardData.gameStates.length}`);
    console.log(`   - Probabilities: ${dashboardData.probabilities.length}`);
    console.log(`   - Events: ${dashboardData.events.length}`);
    console.log(`   - System health: ${dashboardData.systemHealth.length}`);
    console.log('✅ Comprehensive dashboard data retrieved\n');

    // Example 10: Performance monitoring
    console.log('11. Recording performance metrics...');
    await metricsService.recordInfluxDBPerformanceMetric('dashboard_query', 150, true);
    await metricsService.recordInfluxDBPerformanceMetric('batch_write', 75, true);
    console.log('✅ Performance metrics recorded\n');

    // Example 11: Health check
    console.log('12. Checking InfluxDB health...');
    const isHealthy = await metricsService.isHealthy();
    console.log(`🏥 InfluxDB health status: ${isHealthy ? 'Healthy' : 'Unhealthy'}\n`);

    console.log('🎉 InfluxDB usage example completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('- ✅ Real-time game state tracking');
    console.log('- ✅ Probability metrics storage');
    console.log('- ✅ Player statistics recording');
    console.log('- ✅ System performance monitoring');
    console.log('- ✅ API metrics tracking');
    console.log('- ✅ High-frequency batch operations');
    console.log('- ✅ Optimized dashboard queries');
    console.log('- ✅ Data retention policies');
    console.log('- ✅ Performance monitoring');
    console.log('- ✅ Health checks');

  } catch (error) {
    console.error('❌ Error during InfluxDB usage example:', error);
  } finally {
    // Clean up
    console.log('\n13. Closing InfluxDB connection...');
    await metricsService.close();
    console.log('✅ Connection closed');
  }
}

// Example of environment-specific configuration
function getEnvironmentConfig() {
  const environment = process.env.NODE_ENV || 'development';
  
  console.log(`\n🔧 Configuration for ${environment} environment:`);
  console.log('================================================');
  
  const config = {
    ...defaultInfluxDBConfig,
    // Override with environment-specific settings
    url: process.env.INFLUXDB_URL || defaultInfluxDBConfig.url,
    token: process.env.INFLUXDB_TOKEN || defaultInfluxDBConfig.token,
    org: process.env.INFLUXDB_ORG || defaultInfluxDBConfig.org,
    bucket: process.env.INFLUXDB_BUCKET || defaultInfluxDBConfig.bucket,
  };

  console.log(`URL: ${config.url}`);
  console.log(`Organization: ${config.org}`);
  console.log(`Bucket: ${config.bucket}`);
  console.log(`Batch Size: ${config.batchSize}`);
  console.log(`Flush Interval: ${config.flushInterval}ms`);
  console.log(`Timeout: ${config.timeout}ms`);
  
  return config;
}

// Run the example if this file is executed directly
if (require.main === module) {
  getEnvironmentConfig();
  demonstrateInfluxDBUsage().catch(console.error);
}

export { demonstrateInfluxDBUsage, getEnvironmentConfig };
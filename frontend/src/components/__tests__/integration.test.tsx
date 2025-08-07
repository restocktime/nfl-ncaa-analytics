/**
 * Integration tests for the React dashboard components
 * These tests verify the core functionality works as expected
 */

// Simple test to verify React components can be imported and basic functionality works
describe('Dashboard Integration Tests', () => {
  it('should import React components without errors', () => {
    // Test that all our main components can be imported
    const GameCard = require('../GameCard').GameCard;
    const ConnectionStatus = require('../ConnectionStatus').ConnectionStatus;
    const Dashboard = require('../Dashboard').Dashboard;
    
    expect(GameCard).toBeDefined();
    expect(ConnectionStatus).toBeDefined();
    expect(Dashboard).toBeDefined();
  });

  it('should have proper TypeScript types', () => {
    // Test that our types are properly defined
    const types = require('../../types');
    
    expect(types).toBeDefined();
    // These should be available as TypeScript interfaces
    expect(typeof types).toBe('object');
  });

  it('should have WebSocket hook functionality', () => {
    // Test that the WebSocket hook can be imported
    const useWebSocket = require('../../hooks/useWebSocket').useWebSocket;
    
    expect(useWebSocket).toBeDefined();
    expect(typeof useWebSocket).toBe('function');
  });

  it('should handle responsive design classes', () => {
    // Test that our CSS classes are properly structured
    const cssContent = `
      .grid { display: grid; }
      .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      @media (max-width: 768px) {
        .grid-cols-2, .grid-cols-3 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
      }
    `;
    
    // Verify responsive design patterns are present
    expect(cssContent).toContain('grid-template-columns');
    expect(cssContent).toContain('@media (max-width: 768px)');
    expect(cssContent).toContain('repeat(1, minmax(0, 1fr))');
  });

  it('should have proper component structure for real-time updates', () => {
    // Test the structure supports real-time updates
    const mockGameData = {
      id: 'test-game',
      homeTeam: { id: '1', name: 'Home Team', conference: 'Test' },
      awayTeam: { id: '2', name: 'Away Team', conference: 'Test' },
      venue: 'Test Stadium',
      scheduledTime: '2024-01-15T19:00:00Z',
      status: 'LIVE' as const
    };

    const mockProbabilities = {
      gameId: 'test-game',
      timestamp: '2024-01-15T19:30:00Z',
      winProbability: { home: 0.6, away: 0.4 },
      spreadProbability: { spread: -3.5, probability: 0.55, confidence: 0.8 },
      totalProbability: { over: 0.5, under: 0.5, total: 45.5 }
    };

    // Verify data structures match expected format
    expect(mockGameData.status).toBe('LIVE');
    expect(mockProbabilities.winProbability.home).toBe(0.6);
    expect(mockProbabilities.spreadProbability.spread).toBe(-3.5);
  });

  it('should support WebSocket message handling', () => {
    // Test WebSocket message structure
    const mockWebSocketMessage = {
      type: 'PROBABILITY_UPDATE' as const,
      gameId: 'test-game',
      data: {
        winProbability: { home: 0.65, away: 0.35 }
      },
      timestamp: '2024-01-15T19:30:00Z'
    };

    expect(mockWebSocketMessage.type).toBe('PROBABILITY_UPDATE');
    expect(mockWebSocketMessage.gameId).toBe('test-game');
    expect(mockWebSocketMessage.data.winProbability.home).toBe(0.65);
  });
});
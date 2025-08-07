import React, { useState, useEffect, useCallback } from 'react';
import { Game, GameProbabilities, GameState, LiveUpdate } from '../types';
import { ResponsibleGamblingConfig } from '../types/gambling';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGamblingSession } from '../hooks/useGamblingSession';
import { GameCard } from './GameCard';
import { ConnectionStatus } from './ConnectionStatus';
import { ResponsibleGamblingAlert } from './ResponsibleGamblingAlert';
import { SessionTracker } from './SessionTracker';
import { EducationalContent } from './EducationalContent';
import { defaultEducationalContent } from '../data/educationalContent';

export const Dashboard: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [probabilities, setProbabilities] = useState<Map<string, GameProbabilities>>(new Map());
  const [gameStates, setGameStates] = useState<Map<string, GameState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEducationalContent, setShowEducationalContent] = useState(false);

  // Responsible gambling configuration
  const [gamblingConfig] = useState<ResponsibleGamblingConfig>({
    limits: {
      sessionTimeLimit: 120, // 2 hours
      dailyActivityLimit: 50,
      breakReminderInterval: 30, // 30 minutes
      enabled: true
    },
    showEducationalContent: true,
    trackingEnabled: true,
    alertsEnabled: true
  });

  const handleWebSocketMessage = useCallback((update: LiveUpdate) => {
    console.log('Received WebSocket update:', update);
    
    switch (update.type) {
      case 'PROBABILITY_UPDATE':
        setProbabilities(prev => new Map(prev.set(update.gameId, update.data)));
        break;
      case 'SCORE_UPDATE':
      case 'GAME_UPDATE':
        setGameStates(prev => new Map(prev.set(update.gameId, update.data)));
        break;
    }
  }, []);

  const handleWebSocketError = useCallback((error: Event) => {
    console.error('WebSocket error:', error);
    setError('Real-time connection error');
  }, []);

  // Gambling session management
  const {
    session,
    alerts,
    isBreakTime,
    trackActivity,
    acknowledgeAlert,
    takeBreak,
    endBreak,
    endSession: endGamblingSession
  } = useGamblingSession({
    limits: gamblingConfig.limits,
    onAlert: (alert) => {
      console.log('Gambling alert:', alert);
    }
  });

  const { connectionStatus } = useWebSocket({
    url: 'ws://localhost:8000/ws',
    onMessage: handleWebSocketMessage,
    onError: handleWebSocketError,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5
  });

  // Track user interactions for responsible gambling
  const handleUserInteraction = useCallback(() => {
    if (gamblingConfig.trackingEnabled) {
      trackActivity();
    }
  }, [gamblingConfig.trackingEnabled, trackActivity]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Track initial page load as activity
        handleUserInteraction();

        // Fetch games
        const gamesResponse = await fetch('/api/games');
        if (!gamesResponse.ok) {
          throw new Error(`Failed to fetch games: ${gamesResponse.statusText}`);
        }
        const gamesData = await gamesResponse.json();
        setGames(gamesData);

        // Fetch initial probabilities for each game
        const probabilitiesPromises = gamesData.map(async (game: Game) => {
          try {
            const response = await fetch(`/api/games/${game.id}/probabilities`);
            if (response.ok) {
              const probData = await response.json();
              return [game.id, probData];
            }
          } catch (error) {
            console.warn(`Failed to fetch probabilities for game ${game.id}:`, error);
          }
          return null;
        });

        const probabilitiesResults = await Promise.all(probabilitiesPromises);
        const initialProbabilities = new Map();
        probabilitiesResults.forEach(result => {
          if (result) {
            initialProbabilities.set(result[0], result[1]);
          }
        });
        setProbabilities(initialProbabilities);

        // Fetch initial game states for live games
        const liveGames = gamesData.filter((game: Game) => game.status === 'LIVE');
        const gameStatesPromises = liveGames.map(async (game: Game) => {
          try {
            const response = await fetch(`/api/games/${game.id}/state`);
            if (response.ok) {
              const stateData = await response.json();
              return [game.id, stateData];
            }
          } catch (error) {
            console.warn(`Failed to fetch state for game ${game.id}:`, error);
          }
          return null;
        });

        const gameStatesResults = await Promise.all(gameStatesPromises);
        const initialGameStates = new Map();
        gameStatesResults.forEach(result => {
          if (result) {
            initialGameStates.set(result[0], result[1]);
          }
        });
        setGameStates(initialGameStates);

      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [handleUserInteraction]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-red">
            Error: {error}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const liveGames = games.filter(game => game.status === 'LIVE');
  const upcomingGames = games.filter(game => game.status === 'SCHEDULED');
  const completedGames = games.filter(game => game.status === 'FINAL');

  return (
    <div className="container" onClick={handleUserInteraction}>
      <header className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Football Analytics Dashboard</h1>
            <ConnectionStatus status={connectionStatus} />
          </div>
          
          <div className="flex space-x-2">
            {gamblingConfig.showEducationalContent && (
              <button
                onClick={() => setShowEducationalContent(!showEducationalContent)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                {showEducationalContent ? 'Hide' : 'Show'} Responsible Gambling Info
              </button>
            )}
          </div>
        </div>
        
        {/* Responsible Gambling Alerts */}
        {gamblingConfig.alertsEnabled && alerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {alerts.map(alert => (
              <ResponsibleGamblingAlert
                key={alert.id}
                alert={alert}
                onAcknowledge={acknowledgeAlert}
                onTakeBreak={takeBreak}
              />
            ))}
          </div>
        )}
      </header>

      {/* Educational Content */}
      {showEducationalContent && (
        <section className="mb-8">
          <EducationalContent
            content={defaultEducationalContent}
            onClose={() => setShowEducationalContent(false)}
          />
        </section>
      )}

      {/* Session Tracker */}
      {gamblingConfig.trackingEnabled && (
        <section className="mb-8">
          <SessionTracker
            session={session}
            limits={gamblingConfig.limits}
            isBreakTime={isBreakTime}
            onTakeBreak={takeBreak}
            onEndBreak={endBreak}
            onEndSession={endGamblingSession}
          />
        </section>
      )}

      {liveGames.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Live Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {liveGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                probabilities={probabilities.get(game.id)}
                gameState={gameStates.get(game.id)}
              />
            ))}
          </div>
        </section>
      )}

      {upcomingGames.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Upcoming Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {upcomingGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                probabilities={probabilities.get(game.id)}
              />
            ))}
          </div>
        </section>
      )}

      {completedGames.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Completed Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {completedGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                probabilities={probabilities.get(game.id)}
                gameState={gameStates.get(game.id)}
              />
            ))}
          </div>
        </section>
      )}

      {games.length === 0 && (
        <div className="card">
          <div className="text-center text-gray-400">
            No games available at this time.
          </div>
        </div>
      )}
    </div>
  );
};
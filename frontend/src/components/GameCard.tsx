import React from 'react';
import { Game, GameProbabilities, GameState } from '../types';

interface GameCardProps {
  game: Game;
  probabilities?: GameProbabilities;
  gameState?: GameState;
}

export const GameCard: React.FC<GameCardProps> = ({ game, probabilities, gameState }) => {
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'text-green';
      case 'FINAL':
        return 'text-yellow';
      case 'POSTPONED':
        return 'text-red';
      default:
        return '';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex justify-between items-center mb-2">
          <h3 className="card-title">
            {game.awayTeam.name} @ {game.homeTeam.name}
          </h3>
          <span className={`text-sm font-bold ${getStatusColor(game.status)}`}>
            {game.status}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          {game.venue} • {formatTime(game.scheduledTime)}
        </div>
      </div>

      {gameState && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-2xl font-bold">
              {game.awayTeam.name}: {gameState.score.away}
            </div>
            <div className="text-sm">
              Q{gameState.quarter} - {gameState.timeRemaining}
            </div>
            <div className="text-2xl font-bold">
              {game.homeTeam.name}: {gameState.score.home}
            </div>
          </div>
          
          {gameState.possession && (
            <div className="text-sm text-gray-400">
              Possession: {gameState.possession}
              {gameState.fieldPosition && ` • ${gameState.fieldPosition}`}
              {gameState.down && gameState.yardsToGo && 
                ` • ${gameState.down} & ${gameState.yardsToGo}`
              }
            </div>
          )}
        </div>
      )}

      {probabilities && (
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Win Probability</span>
              <span>{(probabilities.winProbability.home * 100).toFixed(1)}% - {(probabilities.winProbability.away * 100).toFixed(1)}%</span>
            </div>
            <div className="probability-bar">
              <div 
                className="probability-fill" 
                style={{ width: `${probabilities.winProbability.home * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Spread ({probabilities.spreadProbability.spread > 0 ? '+' : ''}{probabilities.spreadProbability.spread})</span>
              <span>{(probabilities.spreadProbability.probability * 100).toFixed(1)}%</span>
            </div>
            <div className="text-xs text-gray-400">
              Confidence: {(probabilities.spreadProbability.confidence * 100).toFixed(1)}%
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Total O/U {probabilities.totalProbability.total}</span>
              <span>
                O: {(probabilities.totalProbability.over * 100).toFixed(1)}% | 
                U: {(probabilities.totalProbability.under * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            Last updated: {new Date(probabilities.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {game.weather && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="text-sm text-gray-400">
            Weather: {game.weather.conditions}, {game.weather.temperature}°F, 
            Wind: {game.weather.windSpeed} mph
            {game.weather.precipitation > 0 && `, Rain: ${game.weather.precipitation}%`}
          </div>
        </div>
      )}
    </div>
  );
};
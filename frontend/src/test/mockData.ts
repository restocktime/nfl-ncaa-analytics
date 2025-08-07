import { Game, GameProbabilities, GameState } from '../types';

export const mockGame: Game = {
  id: 'game-1',
  homeTeam: {
    id: 'team-1',
    name: 'Alabama Crimson Tide',
    conference: 'SEC'
  },
  awayTeam: {
    id: 'team-2',
    name: 'Georgia Bulldogs',
    conference: 'SEC'
  },
  venue: 'Bryant-Denny Stadium',
  scheduledTime: '2024-01-15T19:00:00Z',
  status: 'LIVE',
  weather: {
    temperature: 72,
    windSpeed: 5,
    precipitation: 0,
    conditions: 'Clear'
  }
};

export const mockProbabilities: GameProbabilities = {
  gameId: 'game-1',
  timestamp: '2024-01-15T19:30:00Z',
  winProbability: {
    home: 0.65,
    away: 0.35
  },
  spreadProbability: {
    spread: -7.5,
    probability: 0.58,
    confidence: 0.82
  },
  totalProbability: {
    over: 0.52,
    under: 0.48,
    total: 52.5
  }
};

export const mockGameState: GameState = {
  gameId: 'game-1',
  score: {
    home: 14,
    away: 7
  },
  timeRemaining: '8:45',
  quarter: 2,
  possession: 'Alabama Crimson Tide',
  fieldPosition: 'ALA 35',
  down: 2,
  yardsToGo: 8
};

export const mockGames: Game[] = [
  mockGame,
  {
    id: 'game-2',
    homeTeam: {
      id: 'team-3',
      name: 'Ohio State Buckeyes',
      conference: 'Big Ten'
    },
    awayTeam: {
      id: 'team-4',
      name: 'Michigan Wolverines',
      conference: 'Big Ten'
    },
    venue: 'Ohio Stadium',
    scheduledTime: '2024-01-15T15:30:00Z',
    status: 'SCHEDULED'
  },
  {
    id: 'game-3',
    homeTeam: {
      id: 'team-5',
      name: 'Texas Longhorns',
      conference: 'Big 12'
    },
    awayTeam: {
      id: 'team-6',
      name: 'Oklahoma Sooners',
      conference: 'Big 12'
    },
    venue: 'Darrell K Royal Stadium',
    scheduledTime: '2024-01-14T20:00:00Z',
    status: 'FINAL'
  }
];
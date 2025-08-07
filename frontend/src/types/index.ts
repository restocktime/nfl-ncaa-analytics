export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  venue: string;
  scheduledTime: string;
  status: GameStatus;
  weather?: WeatherCondition;
}

export interface Team {
  id: string;
  name: string;
  conference: string;
  division?: string;
  logo?: string;
}

export interface GameProbabilities {
  gameId: string;
  timestamp: string;
  winProbability: {
    home: number;
    away: number;
  };
  spreadProbability: {
    spread: number;
    probability: number;
    confidence: number;
  };
  totalProbability: {
    over: number;
    under: number;
    total: number;
  };
}

export interface GameState {
  gameId: string;
  score: {
    home: number;
    away: number;
  };
  timeRemaining: string;
  quarter: number;
  possession?: string;
  fieldPosition?: string;
  down?: number;
  yardsToGo?: number;
}

export interface LiveUpdate {
  type: 'GAME_UPDATE' | 'PROBABILITY_UPDATE' | 'SCORE_UPDATE';
  gameId: string;
  data: any;
  timestamp: string;
}

export type GameStatus = 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'FINAL' | 'POSTPONED';

export interface WeatherCondition {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  conditions: string;
}

export interface ConnectionStatus {
  connected: boolean;
  lastUpdate?: string;
  error?: string;
}
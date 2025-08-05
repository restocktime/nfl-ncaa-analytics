import { Team } from './team.types';
import { Player } from './player.types';
import { 
  GameStatus, 
  GameType,
  BroadcastInfo,
  TimeRemaining, 
  FieldPosition, 
  Score, 
  Venue, 
  WeatherCondition, 
  Official, 
  MomentumIndicator 
} from './common.types';

/**
 * Game-related type definitions
 */

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  venue: Venue;
  scheduledTime: Date;
  actualStartTime?: Date;
  status: GameStatus;
  season: number;
  week: number;
  gameType: GameType;
  weather?: WeatherCondition;
  officials: Official[];
  broadcast?: BroadcastInfo;
  attendance?: number;
}



export interface GameState {
  game: Game;
  score: Score;
  timeRemaining: TimeRemaining;
  possession: Team;
  fieldPosition: FieldPosition;
  down: number;
  yardsToGo: number;
  momentum: MomentumIndicator;
  lastPlay?: Play;
  drives: Drive[];
  penalties: Penalty[];
  timeouts: {
    home: number;
    away: number;
  };
}

export interface Play {
  id: string;
  gameId: string;
  driveId: string;
  playNumber: number;
  quarter: number;
  timeRemaining: TimeRemaining;
  down: number;
  yardsToGo: number;
  fieldPosition: FieldPosition;
  playType: PlayType;
  description: string;
  result: PlayResult;
  players: PlayParticipant[];
  timestamp: Date;
}

export enum PlayType {
  RUSH = 'rush',
  PASS = 'pass',
  PUNT = 'punt',
  FIELD_GOAL = 'field_goal',
  EXTRA_POINT = 'extra_point',
  KICKOFF = 'kickoff',
  SAFETY = 'safety',
  TIMEOUT = 'timeout',
  PENALTY = 'penalty',
  TWO_MINUTE_WARNING = 'two_minute_warning',
  END_OF_QUARTER = 'end_of_quarter'
}

export interface PlayResult {
  yards: number;
  touchdown: boolean;
  firstDown: boolean;
  turnover: boolean;
  safety: boolean;
  penalty: boolean;
  score?: number;
}

export interface PlayParticipant {
  player: Player;
  role: 'passer' | 'rusher' | 'receiver' | 'tackler' | 'blocker' | 'kicker';
  stats: { [key: string]: number };
}

export interface Drive {
  id: string;
  gameId: string;
  team: Team;
  startTime: TimeRemaining;
  endTime?: TimeRemaining;
  startFieldPosition: FieldPosition;
  endFieldPosition?: FieldPosition;
  plays: Play[];
  result: DriveResult;
  timeOfPossession: number; // seconds
  totalYards: number;
}

export enum DriveResult {
  TOUCHDOWN = 'touchdown',
  FIELD_GOAL = 'field_goal',
  PUNT = 'punt',
  TURNOVER = 'turnover',
  SAFETY = 'safety',
  END_OF_HALF = 'end_of_half',
  END_OF_GAME = 'end_of_game'
}

export interface Penalty {
  id: string;
  gameId: string;
  playId?: string;
  team: Team;
  player?: Player;
  type: string;
  description: string;
  yards: number;
  automaticFirstDown: boolean;
  declined: boolean;
  offsetting: boolean;
  quarter: number;
  timeRemaining: TimeRemaining;
}

export interface BettingLine {
  gameId: string;
  sportsbook: string;
  spread: {
    home: number;
    away: number;
    homeOdds: number;
    awayOdds: number;
  };
  total: {
    line: number;
    overOdds: number;
    underOdds: number;
  };
  moneyline: {
    home: number;
    away: number;
  };
  lastUpdated: Date;
}

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining: TimeRemaining;
  lastUpdated: Date;
  final: boolean;
}
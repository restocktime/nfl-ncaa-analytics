import { Position, InjuryStatus } from './common.types';

/**
 * Player-related type definitions
 */

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: Position;
  height: number; // inches
  weight: number; // pounds
  age: number;
  experience: number; // years in league
  college?: string;
  injuryStatus: InjuryStatus;
  statistics: PlayerStatistics;
  props: PlayerProp[];
  salary?: number;
  contract?: Contract;
}

export interface PlayerStatistics {
  season: number;
  games: number;
  gamesStarted: number;
  
  // Passing (QB)
  passingAttempts?: number;
  passingCompletions?: number;
  passingYards?: number;
  passingTouchdowns?: number;
  interceptions?: number;
  passingRating?: number;
  qbr?: number;
  
  // Rushing (RB, QB, etc.)
  rushingAttempts?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  rushingAverage?: number;
  longRush?: number;
  
  // Receiving (WR, TE, RB)
  receptions?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
  receivingAverage?: number;
  longReception?: number;
  targets?: number;
  
  // Defensive
  tackles?: number;
  assistedTackles?: number;
  sacks?: number;
  tacklesForLoss?: number;
  defensiveInterceptions?: number;
  passesDefended?: number;
  forcedFumbles?: number;
  fumbleRecoveries?: number;
  defensiveTouchdowns?: number;
  
  // Kicking
  fieldGoalAttempts?: number;
  fieldGoalsMade?: number;
  fieldGoalPercentage?: number;
  extraPointAttempts?: number;
  extraPointsMade?: number;
  longFieldGoal?: number;
  
  // Punting
  punts?: number;
  puntingYards?: number;
  puntingAverage?: number;
  longPunt?: number;
  puntsInside20?: number;
  
  // Return Stats
  kickReturns?: number;
  kickReturnYards?: number;
  kickReturnTouchdowns?: number;
  puntReturns?: number;
  puntReturnYards?: number;
  puntReturnTouchdowns?: number;
}

export interface PlayerProp {
  id: string;
  playerId: string;
  type: PropType;
  line: number;
  overOdds: number;
  underOdds: number;
  available: boolean;
  lastUpdated: Date;
}

export enum PropType {
  PASSING_YARDS = 'passing_yards',
  PASSING_TOUCHDOWNS = 'passing_touchdowns',
  RUSHING_YARDS = 'rushing_yards',
  RUSHING_TOUCHDOWNS = 'rushing_touchdowns',
  RECEIVING_YARDS = 'receiving_yards',
  RECEIVING_TOUCHDOWNS = 'receiving_touchdowns',
  RECEPTIONS = 'receptions',
  TACKLES = 'tackles',
  SACKS = 'sacks',
  INTERCEPTIONS = 'interceptions',
  FIELD_GOALS_MADE = 'field_goals_made',
  KICKING_POINTS = 'kicking_points'
}

export interface Contract {
  totalValue: number;
  guaranteedMoney: number;
  years: number;
  averagePerYear: number;
  signedDate: Date;
  expirationDate: Date;
  teamOption?: boolean;
  playerOption?: boolean;
}

export interface InjuryReport {
  playerId: string;
  status: InjuryStatus;
  bodyPart: string;
  description: string;
  expectedReturn?: Date;
  lastUpdated: Date;
  severity: 'minor' | 'moderate' | 'major';
}
/**
 * Common types used across the football analytics system
 */

export enum GameStatus {
  SCHEDULED = 'scheduled',
  PREGAME = 'pregame',
  IN_PROGRESS = 'in_progress',
  HALFTIME = 'halftime',
  FINAL = 'final',
  POSTPONED = 'postponed',
  CANCELLED = 'cancelled'
}

export enum GameType {
  PRESEASON = 'preseason',
  REGULAR_SEASON = 'regular_season',
  PLAYOFF = 'playoff',
  CHAMPIONSHIP = 'championship',
  BOWL_GAME = 'bowl_game'
}

export enum InjuryStatus {
  HEALTHY = 'healthy',
  QUESTIONABLE = 'questionable',
  DOUBTFUL = 'doubtful',
  OUT = 'out',
  IR = 'ir',
  PUP = 'pup'
}

export enum Position {
  // Offense
  QB = 'QB',
  RB = 'RB',
  FB = 'FB',
  WR = 'WR',
  TE = 'TE',
  LT = 'LT',
  LG = 'LG',
  C = 'C',
  RG = 'RG',
  RT = 'RT',
  
  // Defense
  DE = 'DE',
  DT = 'DT',
  NT = 'NT',
  OLB = 'OLB',
  MLB = 'MLB',
  ILB = 'ILB',
  CB = 'CB',
  FS = 'FS',
  SS = 'SS',
  
  // Special Teams
  K = 'K',
  P = 'P',
  LS = 'LS'
}

export interface TimeRemaining {
  quarter: number;
  minutes: number;
  seconds: number;
  overtime?: boolean;
}

export interface FieldPosition {
  yardLine: number;
  side: 'home' | 'away';
}

export interface Score {
  home: number;
  away: number;
  quarter?: number[];
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  capacity: number;
  surface: 'grass' | 'turf';
  indoor: boolean;
  timezone: string;
}

export interface WeatherCondition {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  conditions: string;
  visibility: number;
}

export interface Official {
  id: string;
  name: string;
  position: string;
  experience: number;
}

export interface MomentumIndicator {
  value: number; // -1 to 1, negative favors away team
  trend: 'increasing' | 'decreasing' | 'stable';
  lastUpdated: Date;
}

export interface BroadcastInfo {
  network: string;
  announcers: string[];
  streamingServices?: string[];
}
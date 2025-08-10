/**
 * ESPN Draft Integration - Type Definitions
 * 
 * This file contains TypeScript interfaces for ESPN draft data structures
 * including expert rankings, mock draft results, and ADP data.
 */

// Core ESPN Draft Data Types
export interface ExpertRanking {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  expertRank: number;
  tier: number;
  expertNotes: string;
  projectedPoints: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lastUpdated: Date;
}

export interface MockDraftResult {
  draftId: string;
  leagueSize: number;
  scoringFormat: string;
  picks: DraftPick[];
  expertAnalysis: string;
  draftDate: Date;
}

export interface ADPData {
  playerId: string;
  playerName: string;
  position: string;
  averageDraftPosition: number;
  standardDeviation: number;
  draftPercentage: number;
  positionRank: number;
  leagueSize: number;
  scoringFormat: string;
}

export interface DraftPick {
  pickNumber: number;
  round: number;
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  adp: number;
  expertRank: number;
  actualPick: number;
  valueScore: number;
}

export interface ExpertAnalysis {
  articleId: string;
  title: string;
  author: string;
  publishDate: Date;
  content: string;
  keyInsights: string[];
  playerSpotlights: PlayerSpotlight[];
  draftStrategy: DraftStrategy;
}

export interface PlayerSpotlight {
  playerId: string;
  playerName: string;
  position: string;
  analysis: string;
  projectedRound: number;
  riskFactors: string[];
  upside: string;
}

export interface DraftStrategy {
  earlyRoundStrategy: string;
  middleRoundTargets: string[];
  lateRoundSleepers: string[];
  positionPriority: string[];
  avoidList: string[];
}

// Personalization Types
export interface PersonalizedRanking extends ExpertRanking {
  personalizedRank: number;
  leagueAdjustedRank: number;
  availabilityAtPosition: number;
  recommendationStrength: number;
  personalizedNotes: string;
}

export interface DraftRecommendation {
  playerId: string;
  playerName: string;
  position: string;
  recommendationType: 'BEST_AVAILABLE' | 'POSITIONAL_NEED' | 'VALUE_PICK' | 'SLEEPER';
  confidence: number;
  reasoning: string;
  alternativeOptions: string[];
}

export interface LeagueSettings {
  leagueId: string;
  leagueSize: number;
  scoringFormat: 'STANDARD' | 'PPR' | 'HALF_PPR' | 'SUPERFLEX';
  rosterPositions: RosterPosition[];
  draftType: 'SNAKE' | 'AUCTION' | 'LINEAR';
  customScoring: ScoringRule[];
}

export interface RosterPosition {
  position: string;
  count: number;
  isRequired: boolean;
}

export interface ScoringRule {
  statType: string;
  points: number;
  description: string;
}

// ESPN Account Connection Types
export interface ESPNConnection {
  id: string;
  userId: string;
  espnUserId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  displayName?: string;
  email?: string;
  profileImageUrl?: string;
  connectedAt: Date;
  lastSyncAt?: Date;
  isActive: boolean;
}

export interface ESPNLeague {
  id: string;
  connectionId: string;
  espnLeagueId: string;
  leagueName: string;
  leagueSize: number;
  scoringFormat: string;
  draftType?: string;
  seasonYear: number;
  isActive: boolean;
  lastSyncAt?: Date;
}

export interface DraftHistory {
  id: string;
  userId: string;
  leagueId?: string;
  draftDate: Date;
  draftPosition?: number;
  totalPicks: number;
  draftGrade?: string;
  picks: DraftPick[];
  expertComparison?: any;
  createdAt: Date;
}

// OAuth and Connection Types
export interface OAuthUrl {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
}

export interface ConnectionResult {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  connectedLeagues: ESPNLeague[];
  userProfile: ESPNUserProfile;
}

export interface ESPNUserProfile {
  espnId: string;
  displayName: string;
  email: string;
  profileImage: string;
  memberSince: Date;
}

// Strategy Comparison Types
export interface StrategyComparison {
  draftId: string;
  overallGrade: string;
  alignmentScore: number;
  pickAnalysis: PickAnalysis[];
  recommendations: string[];
  strengths: string[];
  improvements: string[];
}

export interface PickAnalysis {
  pickNumber: number;
  playerSelected: string;
  expertRecommendation: string;
  valueScore: number;
  reasoning: string;
  alternativeOptions: string[];
}

// Positional Need Types
export interface PositionalNeed {
  position: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  currentRoster: string[];
  recommendedTargets: string[];
  reasoning: string;
}

// Cache Types
export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  cacheSize: number;
  memoryUsage: number;
}

// Error Types
export enum DraftServiceError {
  ESPN_API_UNAVAILABLE = 'ESPN_API_UNAVAILABLE',
  INVALID_LEAGUE_SETTINGS = 'INVALID_LEAGUE_SETTINGS',
  CONNECTION_EXPIRED = 'CONNECTION_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export interface ErrorResponse {
  error: DraftServiceError;
  message: string;
  details?: any;
  retryAfter?: number;
  fallbackAvailable: boolean;
}
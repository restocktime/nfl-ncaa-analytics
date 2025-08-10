// Fantasy Football Helper - Core Data Types
export interface FantasyUser {
  id: string;
  email: string;
  name: string;
  leagues: FantasyLeague[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface FantasyLeague {
  id: string;
  name: string;
  platform: 'ESPN' | 'Yahoo' | 'Sleeper' | 'NFL' | 'Custom';
  leagueId: string;
  settings: LeagueSettings;
  roster: FantasyRoster;
  standings: LeagueStandings;
  isActive: boolean;
}

export interface LeagueSettings {
  leagueSize: number;
  scoringSystem: ScoringRules;
  rosterPositions: RosterRequirements;
  tradeDeadline: Date;
  playoffWeeks: number[];
  waiverSystem: WaiverType;
  faabBudget?: number;
  maxTransactions?: number;
}

export interface ScoringRules {
  passing: {
    yards: number; // points per yard
    touchdowns: number;
    interceptions: number;
    completions?: number;
    attempts?: number;
  };
  rushing: {
    yards: number;
    touchdowns: number;
    attempts?: number;
  };
  receiving: {
    yards: number;
    touchdowns: number;
    receptions: number;
    targets?: number;
  };
  kicking: {
    fieldGoals: Record<string, number>; // distance ranges
    extraPoints: number;
    missedFieldGoals?: number;
  };
  defense: {
    sacks: number;
    interceptions: number;
    fumbleRecoveries: number;
    touchdowns: number;
    safeties: number;
    pointsAllowed: Record<string, number>; // points allowed ranges
    yardsAllowed?: Record<string, number>;
  };
  bonuses?: {
    longTouchdowns?: Record<string, number>;
    highYardageGames?: Record<string, number>;
  };
}

export interface RosterRequirements {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  FLEX?: number;
  K: number;
  DEF: number;
  BENCH: number;
  IR?: number;
}

export type WaiverType = 'FAAB' | 'Rolling' | 'Reverse' | 'None';

export interface FantasyRoster {
  starters: FantasyPlayer[];
  bench: FantasyPlayer[];
  ir?: FantasyPlayer[];
  totalValue: number;
  weeklyProjection: number;
  strengthOfSchedule: number;
}

export interface FantasyPlayer {
  playerId: string;
  name: string;
  position: Position;
  team: string;
  fantasyPosition: FantasyPosition;
  isStarter: boolean;
  projectedPoints: number;
  actualPoints?: number;
  seasonProjection: number;
  value: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  injuryStatus: InjuryStatus;
  byeWeek: number;
}

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
export type FantasyPosition = Position | 'FLEX' | 'BENCH' | 'IR';

export interface PlayerProjection {
  playerId: string;
  week: number;
  projectedPoints: number;
  confidenceInterval: [number, number];
  ceiling: number;
  floor: number;
  matchupRating: MatchupRating;
  injuryRisk: InjuryRisk;
  weatherImpact: WeatherImpact;
  usage: UsageProjection;
  gameScript: GameScriptImpact;
}

export interface MatchupRating {
  overall: number; // 1-10 scale
  passDefense: number;
  rushDefense: number;
  redZoneDefense: number;
  homeAwayImpact: number;
  pace: number;
  reasoning: string[];
}

export interface InjuryRisk {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: number;
  impact: 'MINOR' | 'MODERATE' | 'SEVERE';
  description: string;
}

export type InjuryStatus = 'HEALTHY' | 'QUESTIONABLE' | 'DOUBTFUL' | 'OUT' | 'IR' | 'PUP';

export interface WeatherImpact {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  impact: number; // -1 to 1 scale
  description: string;
}

export interface UsageProjection {
  snapShare: number;
  targetShare?: number;
  carryShare?: number;
  redZoneTargets?: number;
  goalLineCarries?: number;
}

export interface GameScriptImpact {
  gameScript: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  impact: number;
  reasoning: string;
}

export interface LineupRecommendation {
  lineup: OptimalLineup;
  projectedPoints: number;
  confidence: number;
  reasoning: string[];
  alternatives: AlternativeOption[];
  riskLevel: RiskLevel;
  salary?: number; // for DFS
}

export interface OptimalLineup {
  QB: FantasyPlayer;
  RB: FantasyPlayer[];
  WR: FantasyPlayer[];
  TE: FantasyPlayer;
  FLEX?: FantasyPlayer;
  K: FantasyPlayer;
  DEF: FantasyPlayer;
}

export interface AlternativeOption {
  player: FantasyPlayer;
  position: FantasyPosition;
  reasoning: string;
  projectionDifference: number;
}

export type RiskLevel = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';

export interface WaiverTarget {
  player: FantasyPlayer;
  priority: number;
  reasoning: string[];
  opportunityScore: number;
  addPercentage: number;
  dropCandidates: FantasyPlayer[];
  faabBid?: number;
}

export interface TradeProposal {
  id: string;
  givingPlayers: FantasyPlayer[];
  receivingPlayers: FantasyPlayer[];
  proposedBy: string;
  proposedTo: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  createdAt: Date;
}

export interface TradeAnalysis {
  fairValue: number; // -1 to 1 scale
  recommendation: 'ACCEPT' | 'REJECT' | 'COUNTER';
  reasoning: string[];
  impactAnalysis: {
    shortTerm: number;
    longTerm: number;
    playoffImpact: number;
  };
  alternativeOffers?: TradeProposal[];
}

export interface WeeklyStrategy {
  week: number;
  priorities: string[];
  lineupRecommendations: LineupRecommendation[];
  waiverTargets: WaiverTarget[];
  tradeOpportunities: TradeOpportunity[];
  byeWeekStrategy?: ByeWeekStrategy;
}

export interface TradeOpportunity {
  targetTeam: string;
  suggestedTrade: TradeProposal;
  mutualBenefit: number;
  likelihood: number;
  reasoning: string[];
}

export interface ByeWeekStrategy {
  affectedPositions: Position[];
  recommendations: {
    waiver: WaiverTarget[];
    trade: TradeOpportunity[];
    streaming: StreamingOption[];
  };
}

export interface StreamingOption {
  player: FantasyPlayer;
  weeks: number[];
  reasoning: string;
  projectedPoints: number;
}

export interface LeagueStandings {
  rank: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  playoffProbability: number;
  strengthOfSchedule: number;
}

export interface UserPreferences {
  riskTolerance: RiskLevel;
  tradingActivity: 'ACTIVE' | 'MODERATE' | 'CONSERVATIVE';
  waiverStrategy: 'AGGRESSIVE' | 'BALANCED' | 'PATIENT';
  notifications: NotificationSettings;
  autoLineup: boolean;
}

export interface NotificationSettings {
  lineupReminders: boolean;
  injuryAlerts: boolean;
  waiverTargets: boolean;
  tradeOpportunities: boolean;
  gameUpdates: boolean;
  email: boolean;
  push: boolean;
}

export interface FantasyAnalytics {
  accuracy: {
    projections: number;
    lineups: number;
    waivers: number;
    trades: number;
  };
  performance: {
    weeklyRank: number[];
    seasonRank: number;
    pointsVsProjection: number;
    optimalLineupPercentage: number;
  };
  decisions: {
    totalLineupChanges: number;
    waiverClaims: number;
    tradesCompleted: number;
    correctStartSits: number;
  };
}

// API Response Types
export interface FantasyApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: Date;
}

export interface LineupOptimizationRequest {
  userId: string;
  leagueId: string;
  week: number;
  constraints?: OptimizationConstraints;
}

export interface OptimizationConstraints {
  mustStart?: string[]; // player IDs
  mustBench?: string[]; // player IDs
  maxRisk?: RiskLevel;
  stackingPreference?: StackingStrategy;
  salaryConstraints?: SalaryConstraints; // for DFS
}

export interface StackingStrategy {
  enabled: boolean;
  qbWrStack?: boolean;
  qbTeStack?: boolean;
  gameStack?: boolean;
}

export interface SalaryConstraints {
  maxSalary: number;
  minSalary?: number;
  maxPlayerSalary?: number;
}

export interface WaiverAnalysisRequest {
  userId: string;
  leagueId: string;
  week: number;
  availablePlayers: string[]; // player IDs
}

export interface TradeAnalysisRequest {
  userId: string;
  leagueId: string;
  trade: TradeProposal;
}

// Database Models
export interface FantasyUserEntity {
  id: string;
  email: string;
  name: string;
  preferences: string; // JSON
  created_at: Date;
  updated_at: Date;
}

export interface FantasyLeagueEntity {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  league_id: string;
  settings: string; // JSON
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FantasyRosterEntity {
  id: string;
  league_id: string;
  week: number;
  roster_data: string; // JSON
  projection: number;
  actual_points?: number;
  created_at: Date;
}

export interface PlayerProjectionEntity {
  id: string;
  player_id: string;
  week: number;
  season: number;
  projected_points: number;
  confidence_lower: number;
  confidence_upper: number;
  ceiling: number;
  floor: number;
  matchup_rating: number;
  injury_risk: string;
  weather_impact: number;
  created_at: Date;
}

export interface FantasyDecisionEntity {
  id: string;
  user_id: string;
  league_id: string;
  week: number;
  decision_type: 'LINEUP' | 'WAIVER' | 'TRADE';
  decision_data: string; // JSON
  outcome?: string; // JSON
  created_at: Date;
}
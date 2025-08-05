/**
 * SportsDataIO API specific types and interfaces
 */

import { GameScore, BettingLine } from './game.types';
import { Player, InjuryReport, PlayerProp } from './player.types';
import { Team } from './team.types';
import { GameStatus, Position, InjuryStatus } from './common.types';

/**
 * SportsDataIO API response wrapper
 */
export interface SportsDataIOResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * SportsDataIO Game data structure
 */
export interface SportsDataIOGame {
  GameID: number;
  Season: number;
  SeasonType: number;
  Week: number;
  Date: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayTeamID: number;
  HomeTeamID: number;
  AwayScore?: number;
  HomeScore?: number;
  Quarter?: number;
  TimeRemainingMinutes?: number;
  TimeRemainingSeconds?: number;
  Status: string;
  Stadium: string;
  Temperature?: number;
  Humidity?: number;
  WindSpeed?: number;
  OverUnder?: number;
  PointSpread?: number;
  AwayTeamMoneyLine?: number;
  HomeTeamMoneyLine?: number;
  GlobalGameID: number;
  GlobalAwayTeamID: number;
  GlobalHomeTeamID: number;
  StadiumID: number;
  IsClosed: boolean;
  Updated: string;
}

/**
 * SportsDataIO Team data structure
 */
export interface SportsDataIOTeam {
  TeamID: number;
  Key: string;
  City: string;
  Name: string;
  Conference: string;
  Division?: string;
  FullName: string;
  StadiumID: number;
  ByeWeek?: number;
  AverageDraftPosition?: number;
  AverageDraftPositionPPR?: number;
  HeadCoach: string;
  OffensiveCoordinator?: string;
  DefensiveCoordinator?: string;
  OffensiveScheme?: string;
  DefensiveScheme?: string;
  UpcomingSalary?: number;
  UpcomingOpponent?: string;
  UpcomingOpponentRank?: number;
  UpcomingOpponentPositionRank?: number;
  UpcomingFanDuelSalary?: number;
  UpcomingDraftKingsSalary?: number;
  UpcomingYahooSalary?: number;
  GlobalTeamID: number;
  PrimaryColor: string;
  SecondaryColor: string;
  TertiaryColor?: string;
  QuaternaryColor?: string;
  WikipediaLogoUrl?: string;
  WikipediaWordMarkUrl?: string;
}

/**
 * SportsDataIO Player data structure
 */
export interface SportsDataIOPlayer {
  PlayerID: number;
  Team: string;
  Number: number;
  FirstName: string;
  LastName: string;
  Position: string;
  Status: string;
  Height: string;
  Weight: number;
  BirthDate: string;
  College: string;
  Experience: number;
  FantasyPosition: string;
  Active: boolean;
  PositionCategory: string;
  Name: string;
  Age: number;
  ExperienceString: string;
  BirthDateString: string;
  PhotoUrl?: string;
  ByeWeek?: number;
  UpcomingSalary?: number;
  FanDuelSalary?: number;
  DraftKingsSalary?: number;
  YahooSalary?: number;
  InjuryStatus?: string;
  InjuryBodyPart?: string;
  InjuryStartDate?: string;
  InjuryNotes?: string;
  FanDuelName?: string;
  DraftKingsName?: string;
  YahooName?: string;
  GlobalTeamID: number;
  TeamID: number;
  GlobalPlayerID: number;
}

/**
 * SportsDataIO Player Statistics
 */
export interface SportsDataIOPlayerStats {
  PlayerID: number;
  SeasonType: number;
  Season: number;
  Team: string;
  Number: number;
  Name: string;
  Position: string;
  PositionCategory: string;
  Activated: number;
  Played: number;
  Started: number;
  
  // Passing Stats
  PassingAttempts?: number;
  PassingCompletions?: number;
  PassingYards?: number;
  PassingCompletionPercentage?: number;
  PassingYardsPerAttempt?: number;
  PassingYardsPerCompletion?: number;
  PassingTouchdowns?: number;
  PassingInterceptions?: number;
  PassingRating?: number;
  PassingLong?: number;
  PassingSacks?: number;
  PassingSackYards?: number;
  
  // Rushing Stats
  RushingAttempts?: number;
  RushingYards?: number;
  RushingYardsPerAttempt?: number;
  RushingTouchdowns?: number;
  RushingLong?: number;
  
  // Receiving Stats
  Receptions?: number;
  ReceivingYards?: number;
  ReceivingYardsPerReception?: number;
  ReceivingTouchdowns?: number;
  ReceivingLong?: number;
  Targets?: number;
  
  // Defensive Stats
  Tackles?: number;
  TacklesForLoss?: number;
  Sacks?: number;
  SackYards?: number;
  QuarterbackHits?: number;
  PassesDefended?: number;
  Interceptions?: number;
  InterceptionReturnYards?: number;
  InterceptionReturnTouchdowns?: number;
  FumblesForced?: number;
  FumblesRecovered?: number;
  FumbleReturnYards?: number;
  FumbleReturnTouchdowns?: number;
  
  // Kicking Stats
  FieldGoalsAttempted?: number;
  FieldGoalsMade?: number;
  FieldGoalsLongestMade?: number;
  ExtraPointsAttempted?: number;
  ExtraPointsMade?: number;
  
  // Punting Stats
  Punts?: number;
  PuntYards?: number;
  PuntAverage?: number;
  PuntLong?: number;
  
  // Return Stats
  KickReturns?: number;
  KickReturnYards?: number;
  KickReturnYardsPerAttempt?: number;
  KickReturnTouchdowns?: number;
  KickReturnLong?: number;
  PuntReturns?: number;
  PuntReturnYards?: number;
  PuntReturnYardsPerAttempt?: number;
  PuntReturnTouchdowns?: number;
  PuntReturnLong?: number;
  
  GlobalTeamID: number;
  Updated: string;
  Games: number;
  FantasyPoints?: number;
  FantasyPointsPPR?: number;
}

/**
 * SportsDataIO Injury Report
 */
export interface SportsDataIOInjury {
  InjuryID: number;
  SeasonType: number;
  Season: number;
  Week: number;
  PlayerID: number;
  Name: string;
  Position: string;
  Number: number;
  Team: string;
  Opponent: string;
  BodyPart: string;
  Status: string;
  Practice: string;
  PracticeDescription: string;
  DeclaredInactive: boolean;
  Updated: string;
  Created: string;
  TeamID: number;
  OpponentID: number;
  GlobalTeamID: number;
  GlobalOpponentID: number;
}

/**
 * SportsDataIO Odds/Betting Lines
 */
export interface SportsDataIOOdds {
  GameID: number;
  Season: number;
  SeasonType: number;
  Week: number;
  Date: string;
  AwayTeam: string;
  HomeTeam: string;
  PointSpread?: number;
  PointSpreadAwayTeamMoneyLine?: number;
  PointSpreadHomeTeamMoneyLine?: number;
  MoneyLineAwayTeamMoneyLine?: number;
  MoneyLineHomeTeamMoneyLine?: number;
  OverUnder?: number;
  OverPayout?: number;
  UnderPayout?: number;
  Updated: string;
  GlobalGameID: number;
  GlobalAwayTeamID: number;
  GlobalHomeTeamID: number;
  TeamID: number;
  OpponentID: number;
  HomeOrAway: string;
  DateTime: string;
  Day: string;
  IsClosed: boolean;
}

/**
 * SportsDataIO API endpoints configuration
 */
export interface SportsDataIOEndpoints {
  games: string;
  teams: string;
  players: string;
  playerStats: string;
  injuries: string;
  odds: string;
  liveScores: string;
  playerProps: string;
}

/**
 * SportsDataIO API configuration
 */
export interface SportsDataIOConfig {
  apiKey: string;
  baseUrl: string;
  endpoints: SportsDataIOEndpoints;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

/**
 * Utility functions for converting SportsDataIO data to internal types
 */
export class SportsDataIOMapper {
  static mapGameStatus(status: string): GameStatus {
    switch (status.toLowerCase()) {
      case 'scheduled':
      case 'pregame':
        return GameStatus.SCHEDULED;
      case 'inprogress':
      case 'in progress':
        return GameStatus.IN_PROGRESS;
      case 'halftime':
        return GameStatus.HALFTIME;
      case 'final':
      case 'closed':
        return GameStatus.FINAL;
      case 'postponed':
        return GameStatus.POSTPONED;
      case 'cancelled':
        return GameStatus.CANCELLED;
      default:
        return GameStatus.SCHEDULED;
    }
  }

  static mapPosition(position: string): Position {
    const pos = position.toUpperCase();
    return Position[pos as keyof typeof Position] || Position.QB;
  }

  static mapInjuryStatus(status: string): InjuryStatus {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'active':
        return InjuryStatus.HEALTHY;
      case 'questionable':
      case 'q':
        return InjuryStatus.QUESTIONABLE;
      case 'doubtful':
      case 'd':
        return InjuryStatus.DOUBTFUL;
      case 'out':
      case 'o':
        return InjuryStatus.OUT;
      case 'ir':
      case 'injured reserve':
        return InjuryStatus.IR;
      case 'pup':
      case 'physically unable to perform':
        return InjuryStatus.PUP;
      default:
        return InjuryStatus.HEALTHY;
    }
  }

  static parseHeight(height: string): number {
    // Convert height string like "6-2" to inches
    const parts = height.split('-');
    if (parts.length === 2) {
      const feet = parseInt(parts[0], 10);
      const inches = parseInt(parts[1], 10);
      return feet * 12 + inches;
    }
    return 0;
  }

  static parseDate(dateString: string): Date {
    return new Date(dateString);
  }
}
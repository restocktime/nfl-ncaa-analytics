import { Player } from './player.types';

/**
 * Team-related type definitions
 */

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  conference: string;
  division?: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  roster: Player[];
  coaching: CoachingStaff;
  statistics: TeamStatistics;
  homeVenue: string; // Venue ID
}

export interface CoachingStaff {
  headCoach: Coach;
  offensiveCoordinator: Coach;
  defensiveCoordinator: Coach;
  specialTeamsCoordinator: Coach;
  assistants: Coach[];
}

export interface Coach {
  id: string;
  name: string;
  position: string;
  experience: number;
  previousTeams: string[];
  winLossRecord?: WinLossRecord;
}

export interface WinLossRecord {
  wins: number;
  losses: number;
  ties?: number;
  seasons: number;
  playoffAppearances: number;
  championships: number;
}

export interface TeamStatistics {
  season: number;
  games: number;
  wins: number;
  losses: number;
  ties?: number;
  
  // Offensive Stats
  pointsPerGame: number;
  yardsPerGame: number;
  passingYardsPerGame: number;
  rushingYardsPerGame: number;
  turnoversPerGame: number;
  thirdDownConversion: number;
  redZoneEfficiency: number;
  
  // Defensive Stats
  pointsAllowedPerGame: number;
  yardsAllowedPerGame: number;
  passingYardsAllowedPerGame: number;
  rushingYardsAllowedPerGame: number;
  takeawaysPerGame: number;
  thirdDownDefense: number;
  redZoneDefense: number;
  
  // Special Teams
  fieldGoalPercentage: number;
  puntAverage: number;
  kickReturnAverage: number;
  puntReturnAverage: number;
  
  // Advanced Metrics
  strengthOfSchedule: number;
  powerRating: number;
  eloRating: number;
}

export interface SituationalStats {
  redZone: {
    attempts: number;
    touchdowns: number;
    fieldGoals: number;
    efficiency: number;
  };
  thirdDown: {
    attempts: number;
    conversions: number;
    percentage: number;
  };
  fourthDown: {
    attempts: number;
    conversions: number;
    percentage: number;
  };
  goalLine: {
    attempts: number;
    touchdowns: number;
    percentage: number;
  };
}
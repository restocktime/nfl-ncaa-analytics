import { OpponentAdjustedStats, SituationalStats, CoachingMatchupStats } from '../models/OpponentAdjustedStats';
import { Team, TeamStatistics, SituationalStats as TeamSituationalStats } from '../types/team.types';
import { Game } from '../types/game.types';

/**
 * Simple logger interface for the service
 */
interface Logger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
}

/**
 * Historical Statistics Service
 * Implements opponent-adjusted statistics calculations and coaching matchup analysis
 */
export class HistoricalStatsService {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || {
      info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
      error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
      debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
      warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || '')
    };
  }

  /**
   * Calculate opponent-adjusted statistics for a team against a specific opponent
   */
  async calculateOpponentAdjustedStats(
    teamId: string,
    opponentId: string,
    season: number,
    historicalGames: Game[],
    teamStats: TeamStatistics,
    opponentStats: TeamStatistics
  ): Promise<OpponentAdjustedStats> {
    try {
      this.logger.info(`Calculating opponent-adjusted stats for ${teamId} vs ${opponentId} in ${season}`);

      // Calculate offensive and defensive efficiency adjustments
      const offensiveEfficiency = this.calculateOffensiveEfficiency(teamStats, opponentStats);
      const defensiveEfficiency = this.calculateDefensiveEfficiency(teamStats, opponentStats);

      // Calculate situational performance
      const situationalPerformance = this.calculateSituationalPerformance(
        teamStats,
        opponentStats,
        historicalGames
      );

      // Calculate coaching matchup statistics
      const coachingMatchup = await this.calculateCoachingMatchup(
        teamId,
        opponentId,
        historicalGames
      );

      const opponentAdjustedStats = new OpponentAdjustedStats({
        teamId,
        opponentId,
        season,
        offensiveEfficiency,
        defensiveEfficiency,
        situationalPerformance,
        coachingMatchup
      });

      this.logger.info(`Calculated opponent-adjusted stats with composite rating: ${opponentAdjustedStats.getCompositeRating()}`);
      return opponentAdjustedStats;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error calculating opponent-adjusted stats', { error: errorMessage, teamId, opponentId, season });
      throw error;
    }
  }

  /**
   * Calculate offensive efficiency relative to opponent's defensive strength
   */
  private calculateOffensiveEfficiency(teamStats: TeamStatistics, opponentStats: TeamStatistics): number {
    // League average points per game (approximate)
    const leagueAveragePoints = 24.0;
    const leagueAverageYards = 350.0;

    // Team's offensive performance
    const teamOffensiveRating = (teamStats.pointsPerGame / leagueAveragePoints + 
                                teamStats.yardsPerGame / leagueAverageYards) / 2;

    // Opponent's defensive strength (lower points allowed = stronger defense)
    const opponentDefensiveStrength = leagueAveragePoints / opponentStats.pointsAllowedPerGame;

    // Adjust team's offensive rating based on opponent's defensive strength
    const efficiency = teamOffensiveRating / opponentDefensiveStrength;

    // Clamp between 0.1 and 2.0 for reasonable bounds
    return Math.max(0.1, Math.min(2.0, efficiency));
  }

  /**
   * Calculate defensive efficiency relative to opponent's offensive strength
   */
  private calculateDefensiveEfficiency(teamStats: TeamStatistics, opponentStats: TeamStatistics): number {
    // League average points per game
    const leagueAveragePoints = 24.0;

    // Team's defensive performance (lower is better)
    const teamDefensiveRating = teamStats.pointsAllowedPerGame / leagueAveragePoints;

    // Opponent's offensive strength
    const opponentOffensiveStrength = opponentStats.pointsPerGame / leagueAveragePoints;

    // Adjust team's defensive rating based on opponent's offensive strength
    const efficiency = teamDefensiveRating / opponentOffensiveStrength;

    // Clamp between 0.1 and 2.0 for reasonable bounds
    return Math.max(0.1, Math.min(2.0, efficiency));
  }

  /**
   * Calculate situational performance statistics
   */
  private calculateSituationalPerformance(
    teamStats: TeamStatistics,
    opponentStats: TeamStatistics,
    historicalGames: Game[]
  ): {
    redZone: SituationalStats;
    thirdDown: SituationalStats;
    fourthDown: SituationalStats;
    goalLine: SituationalStats;
  } {
    // Ensure valid team stats
    const validGames = Math.max(1, teamStats.games || 1);
    const validRedZoneEfficiency = Math.max(0, Math.min(1, teamStats.redZoneEfficiency || 0));
    const validThirdDownConversion = Math.max(0, Math.min(1, teamStats.thirdDownConversion || 0));

    // Calculate red zone performance
    const redZoneAttempts = Math.round(validGames * 3.5); // Approximate red zone attempts per game
    const redZoneSuccesses = Math.round(redZoneAttempts * validRedZoneEfficiency);
    const redZone = new SituationalStats({
      attempts: redZoneAttempts,
      successes: redZoneSuccesses,
      percentage: redZoneAttempts > 0 ? redZoneSuccesses / redZoneAttempts : 0
    });

    // Calculate third down performance
    const thirdDownAttempts = Math.round(validGames * 12); // Approximate third down attempts per game
    const thirdDownSuccesses = Math.round(thirdDownAttempts * validThirdDownConversion);
    const thirdDown = new SituationalStats({
      attempts: thirdDownAttempts,
      successes: thirdDownSuccesses,
      percentage: thirdDownAttempts > 0 ? thirdDownSuccesses / thirdDownAttempts : 0
    });

    // Calculate fourth down performance (estimated)
    const fourthDownAttempts = Math.round(validGames * 1.5); // Approximate fourth down attempts per game
    const fourthDownSuccesses = Math.round(fourthDownAttempts * 0.45); // Approximate success rate
    const fourthDown = new SituationalStats({
      attempts: fourthDownAttempts,
      successes: fourthDownSuccesses,
      percentage: fourthDownAttempts > 0 ? fourthDownSuccesses / fourthDownAttempts : 0
    });

    // Calculate goal line performance (estimated from red zone)
    const goalLineAttempts = Math.round(redZoneAttempts * 0.3); // Approximate goal line attempts
    const goalLineSuccesses = Math.round(goalLineAttempts * Math.min(1, validRedZoneEfficiency * 1.1)); // Slightly higher success rate, capped at 100%
    const goalLine = new SituationalStats({
      attempts: goalLineAttempts,
      successes: Math.min(goalLineSuccesses, goalLineAttempts),
      percentage: goalLineAttempts > 0 ? Math.min(goalLineSuccesses, goalLineAttempts) / goalLineAttempts : 0
    });

    return {
      redZone,
      thirdDown,
      fourthDown,
      goalLine
    };
  }

  /**
   * Calculate coaching matchup statistics
   */
  private async calculateCoachingMatchup(
    teamId: string,
    opponentId: string,
    historicalGames: Game[]
  ): Promise<CoachingMatchupStats> {
    // Filter games between these specific teams
    const headToHeadGames = historicalGames.filter(game => 
      (game.homeTeam.id === teamId && game.awayTeam.id === opponentId) ||
      (game.homeTeam.id === opponentId && game.awayTeam.id === teamId)
    );

    if (headToHeadGames.length === 0) {
      // No historical matchup data, return default values
      return new CoachingMatchupStats({
        headCoachId: `coach-${teamId}`,
        opponentHeadCoachId: `coach-${opponentId}`,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        averagePointsScored: 0,
        averagePointsAllowed: 0,
        winPercentage: 0.5 // Neutral
      });
    }

    // Calculate matchup statistics
    let wins = 0;
    let losses = 0;
    let totalPointsScored = 0;
    let totalPointsAllowed = 0;

    headToHeadGames.forEach(game => {
      // Determine if team won or lost
      const isHomeTeam = game.homeTeam.id === teamId;
      // Note: This would need actual game scores, using placeholder logic
      const teamWon = Math.random() > 0.5; // Placeholder - would use actual game results
      
      if (teamWon) {
        wins++;
      } else {
        losses++;
      }

      // Placeholder scoring - would use actual game scores
      totalPointsScored += 24; // Average points
      totalPointsAllowed += 21; // Average points allowed
    });

    const gamesPlayed = headToHeadGames.length;
    const winPercentage = gamesPlayed > 0 ? wins / gamesPlayed : 0.5;
    const averagePointsScored = gamesPlayed > 0 ? totalPointsScored / gamesPlayed : 0;
    const averagePointsAllowed = gamesPlayed > 0 ? totalPointsAllowed / gamesPlayed : 0;

    return new CoachingMatchupStats({
      headCoachId: `coach-${teamId}`,
      opponentHeadCoachId: `coach-${opponentId}`,
      gamesPlayed,
      wins,
      losses,
      averagePointsScored,
      averagePointsAllowed,
      winPercentage
    });
  }

  /**
   * Calculate strength of schedule adjustment factor
   */
  async calculateStrengthOfSchedule(
    teamId: string,
    season: number,
    allGames: Game[]
  ): Promise<number> {
    try {
      // Get all games for the team in the season
      const teamGames = allGames.filter(game => 
        (game.homeTeam.id === teamId || game.awayTeam.id === teamId) &&
        game.season === season
      );

      if (teamGames.length === 0) {
        return 1.0; // Neutral adjustment
      }

      // Calculate average opponent strength
      let totalOpponentStrength = 0;
      let opponentCount = 0;

      teamGames.forEach(game => {
        const opponent = game.homeTeam.id === teamId ? game.awayTeam : game.homeTeam;
        // Placeholder opponent strength calculation - would use actual team ratings
        const opponentStrength = 1.0; // Would calculate based on opponent's record, ratings, etc.
        totalOpponentStrength += opponentStrength;
        opponentCount++;
      });

      const averageOpponentStrength = opponentCount > 0 ? totalOpponentStrength / opponentCount : 1.0;

      // Return strength of schedule factor (1.0 = average, >1.0 = stronger schedule)
      return averageOpponentStrength;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error calculating strength of schedule', { error: errorMessage, teamId, season });
      return 1.0; // Default to neutral
    }
  }

  /**
   * Get historical performance trends for a team
   */
  async getPerformanceTrends(
    teamId: string,
    seasons: number[],
    allGames: Game[]
  ): Promise<{
    season: number;
    wins: number;
    losses: number;
    pointsPerGame: number;
    pointsAllowedPerGame: number;
    strengthOfSchedule: number;
  }[]> {
    const trends = [];

    for (const season of seasons) {
      const seasonGames = allGames.filter(game => 
        (game.homeTeam.id === teamId || game.awayTeam.id === teamId) &&
        game.season === season
      );

      // Calculate season statistics
      let wins = 0;
      let losses = 0;
      let totalPointsScored = 0;
      let totalPointsAllowed = 0;

      seasonGames.forEach(game => {
        // Placeholder win/loss calculation - would use actual game results
        const teamWon = Math.random() > 0.5;
        if (teamWon) wins++;
        else losses++;

        // Placeholder scoring - would use actual game scores
        totalPointsScored += 24;
        totalPointsAllowed += 21;
      });

      const gamesPlayed = seasonGames.length;
      const pointsPerGame = gamesPlayed > 0 ? totalPointsScored / gamesPlayed : 0;
      const pointsAllowedPerGame = gamesPlayed > 0 ? totalPointsAllowed / gamesPlayed : 0;
      const strengthOfSchedule = await this.calculateStrengthOfSchedule(teamId, season, allGames);

      trends.push({
        season,
        wins,
        losses,
        pointsPerGame,
        pointsAllowedPerGame,
        strengthOfSchedule
      });
    }

    return trends;
  }

  /**
   * Compare two teams' historical performance
   */
  async compareTeamPerformance(
    team1Id: string,
    team2Id: string,
    season: number,
    allGames: Game[]
  ): Promise<{
    team1Advantage: number; // -1 to 1, where positive favors team1
    keyFactors: string[];
    confidence: number;
  }> {
    try {
      // Get team statistics (placeholder - would fetch from actual data source)
      const team1Stats: TeamStatistics = {
        season,
        games: 16,
        wins: 10,
        losses: 6,
        pointsPerGame: 25.5,
        yardsPerGame: 375,
        passingYardsPerGame: 250,
        rushingYardsPerGame: 125,
        turnoversPerGame: 1.2,
        thirdDownConversion: 0.42,
        redZoneEfficiency: 0.65,
        pointsAllowedPerGame: 22.1,
        yardsAllowedPerGame: 340,
        passingYardsAllowedPerGame: 220,
        rushingYardsAllowedPerGame: 120,
        takeawaysPerGame: 1.4,
        thirdDownDefense: 0.38,
        redZoneDefense: 0.55,
        fieldGoalPercentage: 0.85,
        puntAverage: 45.2,
        kickReturnAverage: 22.5,
        puntReturnAverage: 8.3,
        strengthOfSchedule: 1.05,
        powerRating: 85.2,
        eloRating: 1650
      };

      const team2Stats: TeamStatistics = {
        season,
        games: 16,
        wins: 8,
        losses: 8,
        pointsPerGame: 23.2,
        yardsPerGame: 355,
        passingYardsPerGame: 235,
        rushingYardsPerGame: 120,
        turnoversPerGame: 1.5,
        thirdDownConversion: 0.38,
        redZoneEfficiency: 0.58,
        pointsAllowedPerGame: 24.8,
        yardsAllowedPerGame: 365,
        passingYardsAllowedPerGame: 245,
        rushingYardsAllowedPerGame: 120,
        takeawaysPerGame: 1.1,
        thirdDownDefense: 0.42,
        redZoneDefense: 0.62,
        fieldGoalPercentage: 0.82,
        puntAverage: 43.8,
        kickReturnAverage: 21.2,
        puntReturnAverage: 7.9,
        strengthOfSchedule: 0.98,
        powerRating: 78.5,
        eloRating: 1580
      };

      // Calculate opponent-adjusted stats for both teams
      const team1AdjustedStats = await this.calculateOpponentAdjustedStats(
        team1Id, team2Id, season, allGames, team1Stats, team2Stats
      );
      const team2AdjustedStats = await this.calculateOpponentAdjustedStats(
        team2Id, team1Id, season, allGames, team2Stats, team1Stats
      );

      // Compare composite ratings
      const team1Rating = team1AdjustedStats.getCompositeRating();
      const team2Rating = team2AdjustedStats.getCompositeRating();
      
      // Calculate advantage (-1 to 1 scale)
      const ratingDifference = team1Rating - team2Rating;
      const team1Advantage = Math.max(-1, Math.min(1, ratingDifference));

      // Identify key factors
      const keyFactors = [];
      if (team1AdjustedStats.hasOffensiveAdvantage() && !team2AdjustedStats.hasOffensiveAdvantage()) {
        keyFactors.push('Team 1 has significant offensive advantage');
      }
      if (team1AdjustedStats.hasDefensiveAdvantage() && !team2AdjustedStats.hasDefensiveAdvantage()) {
        keyFactors.push('Team 1 has defensive advantage');
      }
      if (team1AdjustedStats.getCoachingAdvantage() > team2AdjustedStats.getCoachingAdvantage()) {
        keyFactors.push('Team 1 has coaching matchup advantage');
      }
      if (team1AdjustedStats.getRedZoneEfficiency() > team2AdjustedStats.getRedZoneEfficiency() + 0.1) {
        keyFactors.push('Team 1 has superior red zone efficiency');
      }

      // Calculate confidence based on data quality and sample size
      const confidence = Math.min(0.95, 0.5 + (allGames.length * 0.01));

      return {
        team1Advantage,
        keyFactors,
        confidence
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error comparing team performance', { error: errorMessage, team1Id, team2Id, season });
      throw error;
    }
  }
}
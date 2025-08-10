import { 
  WaiverTarget, 
  FantasyPlayer, 
  PlayerProjection,
  FantasyUser,
  FantasyLeague
} from '../types/fantasy.types';
import { Player } from '../models/Player';
import { FantasyMLEngine } from './fantasy-ml-engine';
import { DatabaseService } from './database-service';

export interface OpportunityMetrics {
  snapShareTrend: number;
  targetShareTrend: number;
  redZoneOpportunities: number;
  injuryReplacementValue: number;
  scheduleStrength: number;
  recentPerformance: number;
}

export interface WaiverAnalysisRequest {
  userId: string;
  leagueId: string;
  week: number;
  availablePlayers: string[];
  rosterNeeds?: string[];
}

export class WaiverWireAnalyzer {
  private fantasyMLEngine: FantasyMLEngine;
  private databaseService: DatabaseService;

  constructor(
    fantasyMLEngine: FantasyMLEngine,
    databaseService: DatabaseService
  ) {
    this.fantasyMLEngine = fantasyMLEngine;
    this.databaseService = databaseService;
  }

  /**
   * Analyze waiver wire and identify top targets
   */
  async analyzeWaiverTargets(
    request: WaiverAnalysisRequest
  ): Promise<WaiverTarget[]> {
    try {
      console.log(`Analyzing waiver wire for user ${request.userId}, week ${request.week}`);

      // Get available players
      const availablePlayers = await this.getAvailablePlayers(request.availablePlayers);
      
      // Get user's league and roster context
      const league = await this.getUserLeague(request.userId, request.leagueId);
      const rosterNeeds = await this.analyzeRosterNeeds(league);

      // Analyze each available player
      const targets: WaiverTarget[] = [];
      
      for (const player of availablePlayers) {
        const opportunityScore = await this.calculateOpportunityScore(player, request.week);
        
        if (opportunityScore >= 5.0) { // Minimum threshold for recommendation
          const target = await this.createWaiverTarget(
            player, 
            opportunityScore, 
            request.week,
            league,
            rosterNeeds
          );
          targets.push(target);
        }
      }

      // Sort by opportunity score and return top targets
      return targets
        .sort((a, b) => b.opportunityScore - a.opportunityScore)
        .slice(0, 15); // Limit to top 15 targets

    } catch (error) {
      console.error('Error analyzing waiver targets:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive opportunity score for a player
   */
  async calculateOpportunityScore(player: Player, week: number): Promise<number> {
    try {
      // Get opportunity metrics
      const metrics = await this.getOpportunityMetrics(player, week);
      
      // Get upcoming projections
      const projection = await this.fantasyMLEngine.generateProjectionRange(player, week);
      
      // Calculate base score from projection
      let score = projection.projection.projectedPoints;

      // Apply opportunity multipliers
      score *= (1 + metrics.snapShareTrend * 0.3);
      score *= (1 + metrics.targetShareTrend * 0.25);
      score *= (1 + metrics.redZoneOpportunities * 0.2);
      score *= (1 + metrics.injuryReplacementValue * 0.4);
      score *= (1 + (10 - metrics.scheduleStrength) * 0.1); // Lower schedule strength = higher score
      score *= (1 + metrics.recentPerformance * 0.15);

      // Position-specific adjustments
      score = this.applyPositionAdjustments(score, player.position);

      // Ceiling bonus for high-upside players
      const ceilingBonus = (projection.scenarios.aggressive - projection.projection.projectedPoints) * 0.1;
      score += ceilingBonus;

      return Math.round(score * 10) / 10;
    } catch (error) {
      console.error('Error calculating opportunity score:', error);
      return 0;
    }
  }

  /**
   * Identify breakout candidates based on trend analysis
   */
  async identifyBreakoutCandidates(
    availablePlayers: Player[],
    week: number
  ): Promise<FantasyPlayer[]> {
    const breakoutCandidates: FantasyPlayer[] = [];

    for (const player of availablePlayers) {
      const metrics = await this.getOpportunityMetrics(player, week);
      
      // Breakout criteria
      const isBreakoutCandidate = (
        metrics.snapShareTrend > 0.15 && // 15%+ increase in snap share
        metrics.targetShareTrend > 0.1 && // 10%+ increase in target share
        metrics.recentPerformance > 0.2 && // Strong recent performance
        player.age < 28 // Younger players more likely to break out
      );

      if (isBreakoutCandidate) {
        breakoutCandidates.push(this.convertToFantasyPlayer(player));
      }
    }

    return breakoutCandidates;
  }

  /**
   * Calculate injury replacement value
   */
  async calculateInjuryReplacementValue(
    player: Player,
    week: number
  ): Promise<number> {
    try {
      // Get team's injury report
      const teamInjuries = await this.getTeamInjuryReport(player.team);
      
      let replacementValue = 0;

      // Check if player could replace injured starter
      for (const injury of teamInjuries) {
        if (injury.position === player.position && injury.severity >= 0.7) {
          // High injury severity for same position player
          replacementValue += injury.playerValue * injury.severity;
        }
      }

      // Check for depth chart movement opportunities
      const depthChartPosition = await this.getDepthChartPosition(player);
      if (depthChartPosition <= 2) { // Top 2 on depth chart
        replacementValue += (3 - depthChartPosition) * 2; // Higher value for higher position
      }

      return Math.min(replacementValue, 10); // Cap at 10
    } catch (error) {
      console.error('Error calculating injury replacement value:', error);
      return 0;
    }
  }

  /**
   * Analyze schedule strength for upcoming weeks
   */
  async analyzeScheduleStrength(player: Player, startWeek: number, weeks: number = 4): Promise<number> {
    try {
      let totalStrength = 0;
      let gameCount = 0;

      for (let week = startWeek; week < startWeek + weeks; week++) {
        const opponent = await this.getWeeklyOpponent(player.team, week);
        if (opponent) {
          const matchupRating = await this.fantasyMLEngine.calculateMatchupDifficulty(
            player, 
            { homeTeam: player.team, awayTeam: opponent, week, season: 2024, isHomeGame: true }
          );
          totalStrength += matchupRating.overall;
          gameCount++;
        }
      }

      return gameCount > 0 ? totalStrength / gameCount : 5; // Default to neutral
    } catch (error) {
      console.error('Error analyzing schedule strength:', error);
      return 5; // Neutral schedule strength
    }
  }

  /**
   * Generate FAAB bid recommendation
   */
  calculateFAABBid(
    opportunityScore: number,
    leagueSettings: any,
    userBudget: number,
    rosterNeed: number
  ): number {
    const baseBid = Math.floor(opportunityScore * 2); // Base bid as percentage of budget
    
    // Adjust for roster need
    const needMultiplier = 1 + (rosterNeed * 0.3);
    
    // Adjust for remaining budget
    const budgetMultiplier = userBudget > 50 ? 1.2 : userBudget > 20 ? 1.0 : 0.8;
    
    const recommendedBid = Math.floor(baseBid * needMultiplier * budgetMultiplier);
    
    // Cap at reasonable percentage of budget
    const maxBid = Math.floor(userBudget * 0.25); // Max 25% of budget
    
    return Math.min(recommendedBid, maxBid);
  }

  // Private helper methods

  private async getAvailablePlayers(playerIds: string[]): Promise<Player[]> {
    const players: Player[] = [];
    
    for (const id of playerIds) {
      try {
        const query = 'SELECT * FROM players WHERE id = ?';
        const result = await this.databaseService.query(query, [id]);
        
        if (result.length > 0) {
          players.push(result[0] as Player);
        }
      } catch (error) {
        console.error(`Error fetching player ${id}:`, error);
      }
    }
    
    return players;
  }

  private async getUserLeague(userId: string, leagueId: string): Promise<FantasyLeague> {
    const query = `
      SELECT * FROM fantasy_leagues 
      WHERE user_id = ? AND id = ? AND is_active = true
    `;
    
    const result = await this.databaseService.query(query, [userId, leagueId]);
    
    if (result.length === 0) {
      throw new Error('League not found');
    }

    return {
      id: result[0].id,
      name: result[0].name,
      platform: result[0].platform,
      leagueId: result[0].league_id,
      settings: JSON.parse(result[0].settings),
      roster: { starters: [], bench: [], totalValue: 0, weeklyProjection: 0, strengthOfSchedule: 0 },
      standings: { rank: 1, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, playoffProbability: 0.5, strengthOfSchedule: 0 },
      isActive: result[0].is_active
    };
  }

  private async analyzeRosterNeeds(league: FantasyLeague): Promise<{ [position: string]: number }> {
    // Analyze current roster strength by position
    // Return need score (0-10) for each position
    return {
      'QB': 3,
      'RB': 7,
      'WR': 5,
      'TE': 8,
      'K': 2,
      'DEF': 4
    };
  }

  private async getOpportunityMetrics(player: Player, week: number): Promise<OpportunityMetrics> {
    // Get historical usage trends
    const snapShareTrend = await this.calculateSnapShareTrend(player, week);
    const targetShareTrend = await this.calculateTargetShareTrend(player, week);
    const redZoneOpportunities = await this.calculateRedZoneOpportunities(player, week);
    const injuryReplacementValue = await this.calculateInjuryReplacementValue(player, week);
    const scheduleStrength = await this.analyzeScheduleStrength(player, week);
    const recentPerformance = await this.calculateRecentPerformance(player, week);

    return {
      snapShareTrend,
      targetShareTrend,
      redZoneOpportunities,
      injuryReplacementValue,
      scheduleStrength,
      recentPerformance
    };
  }

  private async calculateSnapShareTrend(player: Player, week: number): Promise<number> {
    // Calculate trend in snap share over last 3 weeks
    // Return value between -1 and 1 (negative = decreasing, positive = increasing)
    
    // Mock implementation - would query actual snap count data
    const recentWeeks = [0.65, 0.72, 0.78]; // Last 3 weeks snap share
    
    if (recentWeeks.length < 2) return 0;
    
    const trend = (recentWeeks[recentWeeks.length - 1] - recentWeeks[0]) / recentWeeks.length;
    return Math.max(-1, Math.min(1, trend));
  }

  private async calculateTargetShareTrend(player: Player, week: number): Promise<number> {
    // Calculate trend in target share for skill position players
    if (!['WR', 'TE', 'RB'].includes(player.position)) return 0;
    
    // Mock implementation
    const recentTargetShares = [0.15, 0.18, 0.22]; // Last 3 weeks
    
    if (recentTargetShares.length < 2) return 0;
    
    const trend = (recentTargetShares[recentTargetShares.length - 1] - recentTargetShares[0]) / recentTargetShares.length;
    return Math.max(-1, Math.min(1, trend));
  }

  private async calculateRedZoneOpportunities(player: Player, week: number): Promise<number> {
    // Calculate red zone usage trend
    // Mock implementation
    return Math.random() * 5; // 0-5 red zone opportunities per game
  }

  private async calculateRecentPerformance(player: Player, week: number): Promise<number> {
    // Calculate performance trend over recent weeks
    // Return value between -1 and 1
    
    // Mock implementation
    const recentScores = [8.5, 12.3, 15.7]; // Last 3 weeks fantasy points
    
    if (recentScores.length < 2) return 0;
    
    const avgRecent = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const seasonAvg = 10; // Mock season average
    
    return Math.max(-1, Math.min(1, (avgRecent - seasonAvg) / seasonAvg));
  }

  private applyPositionAdjustments(score: number, position: string): number {
    // Position scarcity adjustments
    const positionMultipliers = {
      'QB': 0.9,  // QBs are deeper
      'RB': 1.2,  // RBs are scarce
      'WR': 1.0,  // WRs are neutral
      'TE': 1.1,  // TEs have some scarcity
      'K': 0.7,   // Kickers are replaceable
      'DEF': 0.8  // Defenses are somewhat replaceable
    };

    return score * (positionMultipliers[position as keyof typeof positionMultipliers] || 1.0);
  }

  private async createWaiverTarget(
    player: Player,
    opportunityScore: number,
    week: number,
    league: FantasyLeague,
    rosterNeeds: { [position: string]: number }
  ): Promise<WaiverTarget> {
    const reasoning = await this.generateWaiverReasoning(player, opportunityScore, week);
    const dropCandidates = await this.identifyDropCandidates(league, player.position);
    const faabBid = this.calculateFAABBid(
      opportunityScore,
      league.settings,
      100, // Mock budget
      rosterNeeds[player.position] || 5
    );

    return {
      player: this.convertToFantasyPlayer(player),
      priority: Math.ceil(opportunityScore),
      reasoning,
      opportunityScore,
      addPercentage: Math.min(opportunityScore * 10, 100),
      dropCandidates,
      faabBid
    };
  }

  private async generateWaiverReasoning(
    player: Player,
    opportunityScore: number,
    week: number
  ): Promise<string[]> {
    const reasoning: string[] = [];

    if (opportunityScore > 8) {
      reasoning.push('High opportunity score indicates strong potential');
    }

    const metrics = await this.getOpportunityMetrics(player, week);
    
    if (metrics.snapShareTrend > 0.1) {
      reasoning.push('Increasing snap share trend');
    }
    
    if (metrics.targetShareTrend > 0.1) {
      reasoning.push('Growing target share');
    }
    
    if (metrics.injuryReplacementValue > 3) {
      reasoning.push('Could benefit from teammate injury');
    }
    
    if (metrics.scheduleStrength < 4) {
      reasoning.push('Favorable upcoming schedule');
    }

    return reasoning.length > 0 ? reasoning : ['Solid waiver wire option'];
  }

  private async identifyDropCandidates(
    league: FantasyLeague,
    position: string
  ): Promise<FantasyPlayer[]> {
    // Identify players on roster who could be dropped
    // Mock implementation
    return [];
  }

  private convertToFantasyPlayer(player: Player): FantasyPlayer {
    return {
      playerId: player.id,
      name: player.name,
      position: player.position as any,
      team: player.team,
      fantasyPosition: player.position as any,
      isStarter: false,
      projectedPoints: 0,
      seasonProjection: 0,
      value: 0,
      trend: 'STABLE',
      injuryStatus: 'HEALTHY',
      byeWeek: 0
    };
  }

  private async getTeamInjuryReport(team: string): Promise<any[]> {
    // Get current injury report for team
    // Mock implementation
    return [];
  }

  private async getDepthChartPosition(player: Player): Promise<number> {
    // Get player's position on depth chart
    // Mock implementation
    return 2;
  }

  private async getWeeklyOpponent(team: string, week: number): Promise<string | null> {
    // Get opponent for specific week
    // Mock implementation
    return 'OPP';
  }
}
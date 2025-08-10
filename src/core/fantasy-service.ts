import { 
  FantasyUser, 
  FantasyLeague, 
  LineupRecommendation, 
  PlayerProjection, 
  WaiverTarget, 
  TradeProposal, 
  TradeAnalysis, 
  WeeklyStrategy,
  LineupOptimizationRequest,
  WaiverAnalysisRequest,
  TradeAnalysisRequest,
  FantasyApiResponse
} from '../types/fantasy.types';
import { MLModelService } from './ml-model-service';
import { PlayerRepository } from '../repositories/PlayerRepository';
import { WeatherAPIConnector } from './weather-api-connector';
import { DatabaseService } from './database-service';

export class FantasyService {
  private mlModelService: MLModelService;
  private playerRepository: PlayerRepository;
  private weatherConnector: WeatherAPIConnector;
  private databaseService: DatabaseService;

  constructor(
    mlModelService: MLModelService,
    playerRepository: PlayerRepository,
    weatherConnector: WeatherAPIConnector,
    databaseService: DatabaseService
  ) {
    this.mlModelService = mlModelService;
    this.playerRepository = playerRepository;
    this.weatherConnector = weatherConnector;
    this.databaseService = databaseService;
  }

  /**
   * Get optimal lineup recommendations for a user's fantasy team
   */
  async getLineupRecommendations(
    request: LineupOptimizationRequest
  ): Promise<FantasyApiResponse<LineupRecommendation[]>> {
    try {
      console.log(`Generating lineup recommendations for user ${request.userId}, week ${request.week}`);
      
      // Get user's league and roster
      const league = await this.getFantasyLeague(request.userId, request.leagueId);
      if (!league) {
        throw new Error('League not found');
      }

      // Get player projections for the week
      const projections = await this.getWeeklyProjections(
        league.roster.starters.concat(league.roster.bench),
        request.week
      );

      // Generate optimal lineups using ML predictions
      const recommendations = await this.optimizeLineup(
        projections,
        league.settings,
        request.constraints
      );

      return {
        success: true,
        data: recommendations,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error generating lineup recommendations:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Get detailed player projections for fantasy scoring
   */
  async getPlayerProjections(
    playerId: string, 
    week: number
  ): Promise<FantasyApiResponse<PlayerProjection>> {
    try {
      console.log(`Getting projection for player ${playerId}, week ${week}`);
      
      // Get player data
      const player = await this.playerRepository.findById(playerId);
      if (!player) {
        throw new Error('Player not found');
      }

      // Generate ML-based projection
      const projection = await this.generatePlayerProjection(player, week);

      return {
        success: true,
        data: projection,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting player projection:', error);
      return {
        success: false,
        data: {} as PlayerProjection,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Get waiver wire targets and recommendations
   */
  async getWaiverWireTargets(
    request: WaiverAnalysisRequest
  ): Promise<FantasyApiResponse<WaiverTarget[]>> {
    try {
      console.log(`Analyzing waiver wire for user ${request.userId}, week ${request.week}`);
      
      // Get available players
      const availablePlayers = await this.getAvailablePlayers(request.availablePlayers);
      
      // Analyze each player's opportunity and value
      const targets = await this.analyzeWaiverTargets(
        availablePlayers,
        request.week,
        request.userId,
        request.leagueId
      );

      return {
        success: true,
        data: targets,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error analyzing waiver wire:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Analyze trade proposals and provide recommendations
   */
  async analyzeTradeProposal(
    request: TradeAnalysisRequest
  ): Promise<FantasyApiResponse<TradeAnalysis>> {
    try {
      console.log(`Analyzing trade proposal for user ${request.userId}`);
      
      // Get player values and projections
      const analysis = await this.evaluateTradeValue(
        request.trade,
        request.userId,
        request.leagueId
      );

      return {
        success: true,
        data: analysis,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error analyzing trade:', error);
      return {
        success: false,
        data: {} as TradeAnalysis,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Get comprehensive weekly strategy recommendations
   */
  async getWeeklyStrategy(
    userId: string, 
    week: number
  ): Promise<FantasyApiResponse<WeeklyStrategy>> {
    try {
      console.log(`Generating weekly strategy for user ${userId}, week ${week}`);
      
      // Get all user's leagues
      const leagues = await this.getUserLeagues(userId);
      
      // Generate strategy for primary league (or all leagues)
      const strategy = await this.generateWeeklyStrategy(leagues[0], week);

      return {
        success: true,
        data: strategy,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error generating weekly strategy:', error);
      return {
        success: false,
        data: {} as WeeklyStrategy,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  // Private helper methods

  private async getFantasyLeague(userId: string, leagueId: string): Promise<FantasyLeague | null> {
    try {
      const query = `
        SELECT fl.*, fu.name as user_name 
        FROM fantasy_leagues fl
        JOIN fantasy_users fu ON fl.user_id = fu.id
        WHERE fl.user_id = ? AND fl.id = ? AND fl.is_active = true
      `;
      
      const result = await this.databaseService.query(query, [userId, leagueId]);
      
      if (result.length === 0) {
        return null;
      }

      const leagueData = result[0];
      return {
        id: leagueData.id,
        name: leagueData.name,
        platform: leagueData.platform,
        leagueId: leagueData.league_id,
        settings: JSON.parse(leagueData.settings),
        roster: await this.getCurrentRoster(leagueId),
        standings: await this.getLeagueStandings(leagueId),
        isActive: leagueData.is_active
      };
    } catch (error) {
      console.error('Error fetching fantasy league:', error);
      return null;
    }
  }

  private async getCurrentRoster(leagueId: string) {
    // Implementation to get current roster from database
    // This would integrate with the existing player repository
    const query = `
      SELECT roster_data 
      FROM fantasy_rosters 
      WHERE league_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const result = await this.databaseService.query(query, [leagueId]);
    
    if (result.length > 0) {
      return JSON.parse(result[0].roster_data);
    }
    
    // Return empty roster if none found
    return {
      starters: [],
      bench: [],
      totalValue: 0,
      weeklyProjection: 0,
      strengthOfSchedule: 0
    };
  }

  private async getLeagueStandings(leagueId: string) {
    // Implementation to get league standings
    return {
      rank: 1,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      playoffProbability: 0.5,
      strengthOfSchedule: 0
    };
  }

  private async getWeeklyProjections(players: any[], week: number): Promise<PlayerProjection[]> {
    const projections: PlayerProjection[] = [];
    
    for (const player of players) {
      try {
        const projection = await this.generatePlayerProjection(player, week);
        projections.push(projection);
      } catch (error) {
        console.error(`Error generating projection for player ${player.id}:`, error);
        // Continue with other players
      }
    }
    
    return projections;
  }

  private async generatePlayerProjection(player: any, week: number): Promise<PlayerProjection> {
    // Use existing ML models to generate fantasy-specific projections
    const baseProjection = await this.mlModelService.predictPlayerPerformance(player.id, week);
    
    // Convert to fantasy points based on scoring system
    const fantasyPoints = this.convertToFantasyPoints(baseProjection, player.position);
    
    // Get matchup analysis
    const matchupRating = await this.analyzeMatchup(player, week);
    
    // Get weather impact
    const weatherImpact = await this.getWeatherImpact(player, week);
    
    return {
      playerId: player.id,
      week,
      projectedPoints: fantasyPoints.projected,
      confidenceInterval: [fantasyPoints.floor, fantasyPoints.ceiling],
      ceiling: fantasyPoints.ceiling,
      floor: fantasyPoints.floor,
      matchupRating,
      injuryRisk: {
        level: 'LOW',
        probability: 0.1,
        impact: 'MINOR',
        description: 'No injury concerns'
      },
      weatherImpact,
      usage: {
        snapShare: 0.7,
        targetShare: 0.2,
        carryShare: 0.15
      },
      gameScript: {
        gameScript: 'NEUTRAL',
        impact: 0,
        reasoning: 'Even game script expected'
      }
    };
  }

  private convertToFantasyPoints(baseProjection: any, position: string) {
    // Convert raw stats to fantasy points
    // This would use the league's scoring settings
    let projected = 0;
    
    if (position === 'QB') {
      projected = (baseProjection.passingYards || 0) * 0.04 + 
                 (baseProjection.passingTDs || 0) * 4 +
                 (baseProjection.rushingYards || 0) * 0.1 +
                 (baseProjection.rushingTDs || 0) * 6;
    } else if (position === 'RB') {
      projected = (baseProjection.rushingYards || 0) * 0.1 +
                 (baseProjection.rushingTDs || 0) * 6 +
                 (baseProjection.receptions || 0) * 1 +
                 (baseProjection.receivingYards || 0) * 0.1;
    } else if (position === 'WR' || position === 'TE') {
      projected = (baseProjection.receptions || 0) * 1 +
                 (baseProjection.receivingYards || 0) * 0.1 +
                 (baseProjection.receivingTDs || 0) * 6;
    }
    
    return {
      projected,
      ceiling: projected * 1.5,
      floor: projected * 0.6
    };
  }

  private async analyzeMatchup(player: any, week: number) {
    // Analyze opponent strength and matchup favorability
    return {
      overall: 7,
      passDefense: 6,
      rushDefense: 8,
      redZoneDefense: 7,
      homeAwayImpact: 1,
      pace: 5,
      reasoning: ['Favorable matchup against weak pass defense']
    };
  }

  private async getWeatherImpact(player: any, week: number) {
    try {
      // Get weather data for the game
      const weather = await this.weatherConnector.getGameWeather(player.team, week);
      
      return {
        temperature: weather?.temperature || 70,
        windSpeed: weather?.windSpeed || 5,
        precipitation: weather?.precipitation || 0,
        impact: this.calculateWeatherImpact(weather, player.position),
        description: weather ? 'Weather conditions factored in' : 'No weather impact'
      };
    } catch (error) {
      return {
        temperature: 70,
        windSpeed: 5,
        precipitation: 0,
        impact: 0,
        description: 'Weather data unavailable'
      };
    }
  }

  private calculateWeatherImpact(weather: any, position: string): number {
    if (!weather) return 0;
    
    let impact = 0;
    
    // Wind affects passing more than rushing
    if (position === 'QB' || position === 'WR' || position === 'TE') {
      if (weather.windSpeed > 15) impact -= 0.1;
      if (weather.windSpeed > 25) impact -= 0.2;
    }
    
    // Cold affects all positions slightly
    if (weather.temperature < 32) {
      impact -= 0.05;
    }
    
    // Rain affects all positions
    if (weather.precipitation > 0.1) {
      impact -= 0.1;
    }
    
    return Math.max(-0.3, Math.min(0.1, impact));
  }

  private async optimizeLineup(projections: PlayerProjection[], settings: any, constraints?: any) {
    // Implement lineup optimization algorithm
    // This would use mathematical optimization to find the best lineup
    
    // For now, return a simple recommendation based on projections
    const sortedProjections = projections.sort((a, b) => b.projectedPoints - a.projectedPoints);
    
    return [{
      lineup: this.buildOptimalLineup(sortedProjections, settings),
      projectedPoints: sortedProjections.slice(0, 9).reduce((sum, p) => sum + p.projectedPoints, 0),
      confidence: 0.8,
      reasoning: ['Selected highest projected players', 'Considered matchup ratings'],
      alternatives: [],
      riskLevel: 'MODERATE' as const
    }];
  }

  private buildOptimalLineup(projections: PlayerProjection[], settings: any) {
    // Build lineup based on roster requirements
    // This is a simplified version - real implementation would be more complex
    
    return {
      QB: projections.find(p => this.getPlayerPosition(p.playerId) === 'QB'),
      RB: projections.filter(p => this.getPlayerPosition(p.playerId) === 'RB').slice(0, 2),
      WR: projections.filter(p => this.getPlayerPosition(p.playerId) === 'WR').slice(0, 2),
      TE: projections.find(p => this.getPlayerPosition(p.playerId) === 'TE'),
      K: projections.find(p => this.getPlayerPosition(p.playerId) === 'K'),
      DEF: projections.find(p => this.getPlayerPosition(p.playerId) === 'DEF')
    };
  }

  private getPlayerPosition(playerId: string): string {
    // This would look up the player's position from the database
    // For now, return a placeholder
    return 'RB';
  }

  private async getAvailablePlayers(playerIds: string[]) {
    // Get player data for available players
    const players = [];
    for (const id of playerIds) {
      const player = await this.playerRepository.findById(id);
      if (player) {
        players.push(player);
      }
    }
    return players;
  }

  private async analyzeWaiverTargets(players: any[], week: number, userId: string, leagueId: string) {
    const targets: WaiverTarget[] = [];
    
    for (const player of players) {
      const projection = await this.generatePlayerProjection(player, week);
      const opportunityScore = this.calculateOpportunityScore(player, projection);
      
      if (opportunityScore > 5) { // Threshold for recommendation
        targets.push({
          player: {
            playerId: player.id,
            name: player.name,
            position: player.position,
            team: player.team,
            fantasyPosition: player.position,
            isStarter: false,
            projectedPoints: projection.projectedPoints,
            seasonProjection: projection.projectedPoints * 17,
            value: opportunityScore,
            trend: 'UP',
            injuryStatus: 'HEALTHY',
            byeWeek: player.byeWeek || 0
          },
          priority: Math.floor(opportunityScore),
          reasoning: [`High opportunity score: ${opportunityScore}`, 'Favorable upcoming matchups'],
          opportunityScore,
          addPercentage: Math.min(opportunityScore * 10, 100),
          dropCandidates: [],
          faabBid: Math.floor(opportunityScore * 2)
        });
      }
    }
    
    return targets.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  private calculateOpportunityScore(player: any, projection: PlayerProjection): number {
    let score = projection.projectedPoints;
    
    // Boost score for favorable matchups
    if (projection.matchupRating.overall > 7) {
      score *= 1.2;
    }
    
    // Boost score for high ceiling players
    if (projection.ceiling > projection.projectedPoints * 1.4) {
      score *= 1.1;
    }
    
    return Math.round(score * 10) / 10;
  }

  private async evaluateTradeValue(trade: TradeProposal, userId: string, leagueId: string) {
    // Analyze trade value using player projections and team needs
    const givingValue = await this.calculatePlayersValue(trade.givingPlayers);
    const receivingValue = await this.calculatePlayersValue(trade.receivingPlayers);
    
    const fairValue = (receivingValue - givingValue) / Math.max(givingValue, receivingValue);
    
    return {
      fairValue,
      recommendation: fairValue > 0.1 ? 'ACCEPT' : fairValue < -0.1 ? 'REJECT' : 'COUNTER',
      reasoning: [
        `Giving players value: ${givingValue}`,
        `Receiving players value: ${receivingValue}`,
        `Net value: ${fairValue > 0 ? '+' : ''}${(fairValue * 100).toFixed(1)}%`
      ],
      impactAnalysis: {
        shortTerm: fairValue * 0.8,
        longTerm: fairValue,
        playoffImpact: fairValue * 1.2
      }
    } as TradeAnalysis;
  }

  private async calculatePlayersValue(players: any[]): Promise<number> {
    let totalValue = 0;
    
    for (const player of players) {
      // Calculate rest-of-season value
      const weeklyProjection = await this.generatePlayerProjection(player, 1);
      totalValue += weeklyProjection.projectedPoints * 12; // Remaining weeks
    }
    
    return totalValue;
  }

  private async getUserLeagues(userId: string): Promise<FantasyLeague[]> {
    const query = `
      SELECT * FROM fantasy_leagues 
      WHERE user_id = ? AND is_active = true
    `;
    
    const results = await this.databaseService.query(query, [userId]);
    
    return results.map((row: any) => ({
      id: row.id,
      name: row.name,
      platform: row.platform,
      leagueId: row.league_id,
      settings: JSON.parse(row.settings),
      roster: { starters: [], bench: [], totalValue: 0, weeklyProjection: 0, strengthOfSchedule: 0 },
      standings: { rank: 1, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, playoffProbability: 0.5, strengthOfSchedule: 0 },
      isActive: row.is_active
    }));
  }

  private async generateWeeklyStrategy(league: FantasyLeague, week: number): Promise<WeeklyStrategy> {
    // Generate comprehensive weekly strategy
    const lineupRecommendations = await this.getLineupRecommendations({
      userId: 'user', // This would come from the league
      leagueId: league.id,
      week
    });
    
    return {
      week,
      priorities: [
        'Optimize starting lineup',
        'Monitor injury reports',
        'Evaluate waiver wire targets'
      ],
      lineupRecommendations: lineupRecommendations.data,
      waiverTargets: [],
      tradeOpportunities: []
    };
  }
}
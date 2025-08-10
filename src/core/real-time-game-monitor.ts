import {
  FantasyPlayer,
  PlayerProjection,
  FantasyUser,
  FantasyLeague
} from '../types/fantasy.types';
import { DatabaseService } from './database-service';
import { WebSocketService } from '../api/websocket-service';

export interface LiveGameData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  quarter: string;
  timeRemaining: string;
  homeScore: number;
  awayScore: number;
  isActive: boolean;
  lastUpdate: Date;
}

export interface LivePlayerStats {
  playerId: string;
  gameId: string;
  fantasyPoints: number;
  projectedPoints: number;
  variance: number;
  stats: {
    passingYards?: number;
    passingTDs?: number;
    rushingYards?: number;
    rushingTDs?: number;
    receptions?: number;
    receivingYards?: number;
    receivingTDs?: number;
    fieldGoals?: number;
    extraPoints?: number;
  };
  lastUpdate: Date;
}

export interface GameSituation {
  gameId: string;
  situation: 'NORMAL' | 'GARBAGE_TIME' | 'BLOWOUT' | 'CLOSE_GAME' | 'TWO_MINUTE_DRILL';
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  affectedPositions: string[];
  description: string;
}

export interface FantasyAlert {
  id: string;
  userId: string;
  type: 'INJURY' | 'PERFORMANCE' | 'OPPORTUNITY' | 'WEATHER' | 'LINEUP';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  message: string;
  playerId?: string;
  gameId?: string;
  actionRequired: boolean;
  createdAt: Date;
}

export class RealTimeGameMonitor {
  private databaseService: DatabaseService;
  private websocketService: WebSocketService;
  private activeGames: Map<string, LiveGameData> = new Map();
  private playerStats: Map<string, LivePlayerStats> = new Map();
  private gameUpdateInterval: NodeJS.Timeout | null = null;
  private alertQueue: FantasyAlert[] = [];

  constructor(
    databaseService: DatabaseService,
    websocketService: WebSocketService
  ) {
    this.databaseService = databaseService;
    this.websocketService = websocketService;
  }

  /**
   * Start monitoring live games
   */
  async startMonitoring(): Promise<void> {
    try {
      console.log('🎮 Starting real-time game monitoring...');

      // Get active games
      await this.loadActiveGames();

      // Start update interval
      this.gameUpdateInterval = setInterval(async () => {
        await this.updateLiveData();
      }, 30000); // Update every 30 seconds

      // Setup WebSocket connections
      await this.setupWebSocketConnections();

      console.log(`✅ Monitoring ${this.activeGames.size} active games`);
    } catch (error) {
      console.error('Error starting game monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (this.gameUpdateInterval) {
      clearInterval(this.gameUpdateInterval);
      this.gameUpdateInterval = null;
    }

    this.activeGames.clear();
    this.playerStats.clear();
    
    console.log('🛑 Stopped real-time game monitoring');
  }

  /**
   * Get live fantasy points for a player
   */
  async getLivePlayerStats(playerId: string): Promise<LivePlayerStats | null> {
    return this.playerStats.get(playerId) || null;
  }

  /**
   * Get live game situation analysis
   */
  async getGameSituation(gameId: string): Promise<GameSituation | null> {
    const game = this.activeGames.get(gameId);
    if (!game) return null;

    return this.analyzeGameSituation(game);
  }

  /**
   * Track fantasy performance vs projections
   */
  async trackFantasyPerformance(
    userId: string,
    leagueId: string
  ): Promise<{
    lineup: {
      player: FantasyPlayer;
      livePoints: number;
      projectedPoints: number;
      variance: number;
      status: 'AHEAD' | 'BEHIND' | 'ON_TRACK';
    }[];
    totalLive: number;
    totalProjected: number;
    winProbability: number;
  }> {
    try {
      // Get user's active lineup
      const lineup = await this.getUserActiveLineup(userId, leagueId);
      
      const lineupPerformance = [];
      let totalLive = 0;
      let totalProjected = 0;

      for (const player of lineup) {
        const liveStats = await this.getLivePlayerStats(player.playerId);
        const livePoints = liveStats?.fantasyPoints || 0;
        const projectedPoints = player.projectedPoints;
        const variance = livePoints - projectedPoints;
        
        let status: 'AHEAD' | 'BEHIND' | 'ON_TRACK';
        if (variance > projectedPoints * 0.2) status = 'AHEAD';
        else if (variance < -projectedPoints * 0.2) status = 'BEHIND';
        else status = 'ON_TRACK';

        lineupPerformance.push({
          player,
          livePoints,
          projectedPoints,
          variance,
          status
        });

        totalLive += livePoints;
        totalProjected += projectedPoints;
      }

      // Calculate win probability based on current performance
      const winProbability = this.calculateLiveWinProbability(
        totalLive,
        totalProjected,
        lineupPerformance
      );

      return {
        lineup: lineupPerformance,
        totalLive,
        totalProjected,
        winProbability
      };
    } catch (error) {
      console.error('Error tracking fantasy performance:', error);
      throw error;
    }
  }

  /**
   * Generate real-time alerts for users
   */
  async generateRealTimeAlerts(
    userId: string,
    leagueId: string
  ): Promise<FantasyAlert[]> {
    const alerts: FantasyAlert[] = [];
    
    try {
      // Get user's lineup and league settings
      const lineup = await this.getUserActiveLineup(userId, leagueId);
      const league = await this.getFantasyLeague(leagueId);

      for (const player of lineup) {
        // Check for injury alerts
        const injuryAlert = await this.checkInjuryAlert(player);
        if (injuryAlert) alerts.push(injuryAlert);

        // Check for performance alerts
        const performanceAlert = await this.checkPerformanceAlert(player, userId);
        if (performanceAlert) alerts.push(performanceAlert);

        // Check for opportunity alerts
        const opportunityAlert = await this.checkOpportunityAlert(player);
        if (opportunityAlert) alerts.push(opportunityAlert);
      }

      // Check for weather alerts
      const weatherAlerts = await this.checkWeatherAlerts(lineup);
      alerts.push(...weatherAlerts);

      // Check for lineup alerts (late scratches, etc.)
      const lineupAlerts = await this.checkLineupAlerts(lineup, userId);
      alerts.push(...lineupAlerts);

      return alerts.sort((a, b) => {
        const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Error generating real-time alerts:', error);
      return [];
    }
  }

  /**
   * Analyze garbage time opportunities
   */
  async analyzeGarbageTimeOpportunities(): Promise<{
    gameId: string;
    situation: string;
    beneficiaries: {
      playerId: string;
      playerName: string;
      position: string;
      opportunityType: string;
      projectedBonus: number;
    }[];
  }[]> {
    const opportunities = [];

    for (const [gameId, game] of this.activeGames) {
      const situation = await this.analyzeGameSituation(game);
      
      if (situation?.situation === 'GARBAGE_TIME' || situation?.situation === 'BLOWOUT') {
        const beneficiaries = await this.identifyGarbageTimeBeneficiaries(gameId, game);
        
        if (beneficiaries.length > 0) {
          opportunities.push({
            gameId,
            situation: situation.description,
            beneficiaries
          });
        }
      }
    }

    return opportunities;
  }

  /**
   * Calculate Monday Night Football win probabilities
   */
  async calculateMNFWinProbability(
    userId: string,
    leagueId: string,
    opponentId: string
  ): Promise<{
    userProjection: number;
    opponentProjection: number;
    winProbability: number;
    tieBreaker: string;
    scenarios: {
      description: string;
      probability: number;
      outcome: 'WIN' | 'LOSS' | 'TIE';
    }[];
  }> {
    try {
      // Get remaining players for both teams
      const userRemaining = await this.getRemainingPlayers(userId, leagueId);
      const opponentRemaining = await this.getRemainingPlayers(opponentId, leagueId);

      // Calculate projections
      const userProjection = userRemaining.reduce((sum, p) => sum + p.projectedPoints, 0);
      const opponentProjection = opponentRemaining.reduce((sum, p) => sum + p.projectedPoints, 0);

      // Monte Carlo simulation for win probability
      const winProbability = await this.runMNFSimulation(
        userRemaining,
        opponentRemaining,
        1000 // Number of simulations
      );

      // Generate scenarios
      const scenarios = await this.generateMNFScenarios(
        userRemaining,
        opponentRemaining
      );

      return {
        userProjection,
        opponentProjection,
        winProbability,
        tieBreaker: 'Bench points', // Would get actual tiebreaker
        scenarios
      };
    } catch (error) {
      console.error('Error calculating MNF win probability:', error);
      throw error;
    }
  }

  // Private helper methods

  private async loadActiveGames(): Promise<void> {
    try {
      // This would connect to NFL API or data feed
      // Mock implementation with sample games
      const mockGames: LiveGameData[] = [
        {
          gameId: 'game1',
          homeTeam: 'KC',
          awayTeam: 'BUF',
          quarter: 'Q2',
          timeRemaining: '8:42',
          homeScore: 14,
          awayScore: 10,
          isActive: true,
          lastUpdate: new Date()
        },
        {
          gameId: 'game2',
          homeTeam: 'DAL',
          awayTeam: 'PHI',
          quarter: 'Q3',
          timeRemaining: '12:15',
          homeScore: 21,
          awayScore: 7,
          isActive: true,
          lastUpdate: new Date()
        }
      ];

      for (const game of mockGames) {
        this.activeGames.set(game.gameId, game);
      }
    } catch (error) {
      console.error('Error loading active games:', error);
      throw error;
    }
  }

  private async updateLiveData(): Promise<void> {
    try {
      // Update game data and player stats
      for (const [gameId, game] of this.activeGames) {
        // This would fetch real-time updates from NFL API
        await this.updateGameData(gameId);
        await this.updatePlayerStats(gameId);
      }

      // Process alerts
      await this.processAlertQueue();
    } catch (error) {
      console.error('Error updating live data:', error);
    }
  }

  private async setupWebSocketConnections(): Promise<void> {
    // Setup WebSocket connections for real-time updates
    this.websocketService.on('gameUpdate', (data: any) => {
      this.handleGameUpdate(data);
    });

    this.websocketService.on('playerUpdate', (data: any) => {
      this.handlePlayerUpdate(data);
    });

    this.websocketService.on('injuryUpdate', (data: any) => {
      this.handleInjuryUpdate(data);
    });
  }

  private async updateGameData(gameId: string): Promise<void> {
    // Mock implementation - would fetch from real API
    const game = this.activeGames.get(gameId);
    if (game) {
      // Simulate game progression
      game.lastUpdate = new Date();
      this.activeGames.set(gameId, game);
    }
  }

  private async updatePlayerStats(gameId: string): Promise<void> {
    // Mock implementation - would fetch real player stats
    const mockStats: LivePlayerStats = {
      playerId: 'player1',
      gameId,
      fantasyPoints: 12.5,
      projectedPoints: 15.0,
      variance: -2.5,
      stats: {
        rushingYards: 85,
        rushingTDs: 1,
        receptions: 3,
        receivingYards: 25
      },
      lastUpdate: new Date()
    };

    this.playerStats.set(mockStats.playerId, mockStats);
  }

  private handleGameUpdate(data: any): void {
    // Handle real-time game updates
    const gameId = data.gameId;
    const game = this.activeGames.get(gameId);
    
    if (game) {
      // Update game state
      Object.assign(game, data);
      this.activeGames.set(gameId, game);
      
      // Broadcast to connected clients
      this.websocketService.broadcast('gameUpdate', data);
    }
  }

  private handlePlayerUpdate(data: any): void {
    // Handle real-time player stat updates
    const playerId = data.playerId;
    const existingStats = this.playerStats.get(playerId);
    
    if (existingStats) {
      Object.assign(existingStats, data);
      this.playerStats.set(playerId, existingStats);
    } else {
      this.playerStats.set(playerId, data);
    }
    
    // Broadcast to connected clients
    this.websocketService.broadcast('playerUpdate', data);
  }

  private handleInjuryUpdate(data: any): void {
    // Handle injury updates and generate alerts
    const alert: FantasyAlert = {
      id: `injury_${Date.now()}`,
      userId: '', // Will be set when sending to specific users
      type: 'INJURY',
      priority: 'URGENT',
      title: `${data.playerName} Injury Update`,
      message: data.injuryDescription,
      playerId: data.playerId,
      gameId: data.gameId,
      actionRequired: true,
      createdAt: new Date()
    };

    this.alertQueue.push(alert);
  }

  private async processAlertQueue(): Promise<void> {
    while (this.alertQueue.length > 0) {
      const alert = this.alertQueue.shift();
      if (alert) {
        await this.sendAlert(alert);
      }
    }
  }

  private async sendAlert(alert: FantasyAlert): Promise<void> {
    // Send alert to affected users
    try {
      // Get users who have this player
      const affectedUsers = await this.getUsersWithPlayer(alert.playerId || '');
      
      for (const userId of affectedUsers) {
        const userAlert = { ...alert, userId };
        
        // Save to database
        await this.saveAlert(userAlert);
        
        // Send via WebSocket if user is connected
        this.websocketService.sendToUser(userId, 'fantasyAlert', userAlert);
        
        // Send push notification if configured
        await this.sendPushNotification(userId, userAlert);
      }
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  }

  private analyzeGameSituation(game: LiveGameData): GameSituation {
    const scoreDiff = Math.abs(game.homeScore - game.awayScore);
    const quarter = game.quarter;
    
    let situation: GameSituation['situation'] = 'NORMAL';
    let impact: GameSituation['impact'] = 'NEUTRAL';
    let description = '';
    let affectedPositions: string[] = [];

    // Analyze game situation
    if (scoreDiff >= 21 && (quarter === 'Q4' || quarter === 'OT')) {
      situation = 'GARBAGE_TIME';
      impact = 'NEGATIVE';
      description = 'Garbage time - starters may be pulled';
      affectedPositions = ['RB', 'WR'];
    } else if (scoreDiff >= 14) {
      situation = 'BLOWOUT';
      impact = 'NEGATIVE';
      description = 'Blowout game - game script may change';
      affectedPositions = ['QB', 'WR'];
    } else if (scoreDiff <= 3 && quarter === 'Q4') {
      situation = 'CLOSE_GAME';
      impact = 'POSITIVE';
      description = 'Close game - increased passing volume expected';
      affectedPositions = ['QB', 'WR', 'TE'];
    } else if (game.timeRemaining.includes('2:') && quarter === 'Q4') {
      situation = 'TWO_MINUTE_DRILL';
      impact = 'POSITIVE';
      description = 'Two-minute drill - passing opportunities';
      affectedPositions = ['QB', 'WR', 'TE'];
    }

    return {
      gameId: game.gameId,
      situation,
      impact,
      affectedPositions,
      description
    };
  }

  private calculateLiveWinProbability(
    totalLive: number,
    totalProjected: number,
    lineup: any[]
  ): number {
    // Simple win probability calculation
    // In reality, this would be much more sophisticated
    const variance = totalLive - totalProjected;
    const baseProb = 0.5;
    
    // Adjust based on current performance
    const adjustment = variance / Math.max(totalProjected, 1) * 0.3;
    
    return Math.max(0.05, Math.min(0.95, baseProb + adjustment));
  }

  private async identifyGarbageTimeBeneficiaries(
    gameId: string,
    game: LiveGameData
  ): Promise<any[]> {
    // Identify players who benefit from garbage time
    const beneficiaries = [];
    
    // Mock implementation
    if (game.homeScore > game.awayScore + 14) {
      // Losing team's pass catchers benefit
      beneficiaries.push({
        playerId: 'wr1',
        playerName: 'Backup WR',
        position: 'WR',
        opportunityType: 'Garbage time targets',
        projectedBonus: 3.5
      });
    }
    
    return beneficiaries;
  }

  private async runMNFSimulation(
    userPlayers: FantasyPlayer[],
    opponentPlayers: FantasyPlayer[],
    simulations: number
  ): Promise<number> {
    let wins = 0;
    
    for (let i = 0; i < simulations; i++) {
      let userTotal = 0;
      let opponentTotal = 0;
      
      // Simulate each player's performance
      for (const player of userPlayers) {
        userTotal += this.simulatePlayerPerformance(player);
      }
      
      for (const player of opponentPlayers) {
        opponentTotal += this.simulatePlayerPerformance(player);
      }
      
      if (userTotal > opponentTotal) {
        wins++;
      }
    }
    
    return wins / simulations;
  }

  private simulatePlayerPerformance(player: FantasyPlayer): number {
    // Simple simulation using normal distribution
    const mean = player.projectedPoints;
    const stdDev = mean * 0.3; // 30% standard deviation
    
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    return Math.max(0, mean + z0 * stdDev);
  }

  private async generateMNFScenarios(
    userPlayers: FantasyPlayer[],
    opponentPlayers: FantasyPlayer[]
  ): Promise<any[]> {
    const scenarios = [];
    
    // Generate common scenarios
    scenarios.push({
      description: 'Both players hit projections',
      probability: 0.25,
      outcome: userPlayers[0]?.projectedPoints > opponentPlayers[0]?.projectedPoints ? 'WIN' : 'LOSS'
    });
    
    scenarios.push({
      description: 'Your player exceeds projection by 20%',
      probability: 0.15,
      outcome: 'WIN'
    });
    
    scenarios.push({
      description: 'Opponent player exceeds projection by 20%',
      probability: 0.15,
      outcome: 'LOSS'
    });
    
    return scenarios;
  }

  // Helper methods for database operations

  private async getUserActiveLineup(userId: string, leagueId: string): Promise<FantasyPlayer[]> {
    // Mock implementation
    return [
      {
        playerId: 'qb1',
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        fantasyPosition: 'QB',
        isStarter: true,
        projectedPoints: 22.5,
        seasonProjection: 380,
        value: 95,
        trend: 'UP',
        injuryStatus: 'HEALTHY',
        byeWeek: 12
      }
    ];
  }

  private async getFantasyLeague(leagueId: string): Promise<any> {
    // Mock implementation
    return {
      settings: { faabBudget: 100 },
      roster: { starters: [], bench: [] }
    };
  }

  private async getRemainingPlayers(userId: string, leagueId: string): Promise<FantasyPlayer[]> {
    // Get players who haven't played yet
    return [];
  }

  private async getUsersWithPlayer(playerId: string): Promise<string[]> {
    // Get all users who have this player on their roster
    const query = `
      SELECT DISTINCT user_id FROM fantasy_rosters 
      WHERE player_id = ? AND status = 'ACTIVE'
    `;
    
    const results = await this.databaseService.query(query, [playerId]);
    return results.map((row: any) => row.user_id);
  }

  private async saveAlert(alert: FantasyAlert): Promise<void> {
    const query = `
      INSERT INTO fantasy_alerts (
        id, user_id, type, priority, title, message, 
        player_id, game_id, action_required, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.databaseService.query(query, [
      alert.id,
      alert.userId,
      alert.type,
      alert.priority,
      alert.title,
      alert.message,
      alert.playerId,
      alert.gameId,
      alert.actionRequired,
      alert.createdAt
    ]);
  }

  private async sendPushNotification(userId: string, alert: FantasyAlert): Promise<void> {
    // Implementation would depend on push notification service
    console.log(`Sending push notification to ${userId}: ${alert.title}`);
  }

  private async checkInjuryAlert(player: FantasyPlayer): Promise<FantasyAlert | null> {
    // Check for injury updates
    if (player.injuryStatus !== 'HEALTHY') {
      return {
        id: `injury_${player.playerId}_${Date.now()}`,
        userId: '',
        type: 'INJURY',
        priority: 'HIGH',
        title: `${player.name} Injury Update`,
        message: `${player.name} is listed as ${player.injuryStatus}`,
        playerId: player.playerId,
        actionRequired: true,
        createdAt: new Date()
      };
    }
    return null;
  }

  private async checkPerformanceAlert(player: FantasyPlayer, userId: string): Promise<FantasyAlert | null> {
    const liveStats = this.playerStats.get(player.playerId);
    
    if (liveStats && liveStats.variance < -5) {
      return {
        id: `performance_${player.playerId}_${Date.now()}`,
        userId,
        type: 'PERFORMANCE',
        priority: 'MEDIUM',
        title: `${player.name} Underperforming`,
        message: `${player.name} is ${Math.abs(liveStats.variance).toFixed(1)} points below projection`,
        playerId: player.playerId,
        actionRequired: false,
        createdAt: new Date()
      };
    }
    return null;
  }

  private async checkOpportunityAlert(player: FantasyPlayer): Promise<FantasyAlert | null> {
    // Check for opportunity changes (teammate injuries, etc.)
    return null; // Mock implementation
  }

  private async checkWeatherAlerts(lineup: FantasyPlayer[]): Promise<FantasyAlert[]> {
    // Check for weather impacts on games
    return []; // Mock implementation
  }

  private async checkLineupAlerts(lineup: FantasyPlayer[], userId: string): Promise<FantasyAlert[]> {
    // Check for late scratches, inactive players, etc.
    return []; // Mock implementation
  }
}
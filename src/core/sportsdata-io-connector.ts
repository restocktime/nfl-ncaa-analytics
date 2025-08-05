import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { Config } from './config';
import { Logger } from './logger';
import { HttpAPIConnector } from './http-api-connector';
import { APIRequest, APIResponse, APIError } from '../types/api.types';
import {
  SportsDataIOConfig,
  SportsDataIOGame,
  SportsDataIOTeam,
  SportsDataIOPlayer,
  SportsDataIOPlayerStats,
  SportsDataIOInjury,
  SportsDataIOOdds,
  SportsDataIOMapper
} from '../types/sportsdata-io.types';
import { GameScore, BettingLine } from '../types/game.types';
import { Player, InjuryReport, PlayerProp } from '../types/player.types';
import { Team } from '../types/team.types';

/**
 * SportsDataIO API connector for NFL and college football data
 */
@injectable()
export class SportsDataIOConnector extends HttpAPIConnector {
  private readonly sportsDataConfig: SportsDataIOConfig;

  constructor(
    @inject(TYPES.Config) config: Config,
    @inject(TYPES.Logger) logger: Logger
  ) {
    const apiKey = config.get<string>('apis.sportsDataIO.apiKey');
    const baseUrl = config.get<string>('apis.sportsDataIO.baseUrl');
    
    const defaultHeaders = {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Accept': 'application/json'
    };

    super(config, logger, 'SportsDataIO', baseUrl, defaultHeaders);

    this.sportsDataConfig = {
      apiKey,
      baseUrl,
      endpoints: {
        games: '/scores/{format}/{season}',
        teams: '/teams/{format}',
        players: '/players/{format}',
        playerStats: '/playerstats/{format}/{season}/{week}',
        injuries: '/injuries/{format}/{season}/{week}',
        odds: '/odds/{format}/{season}',
        liveScores: '/scoresbasic/{format}',
        playerProps: '/playerprops/{format}/{season}/{week}'
      },
      rateLimit: {
        requestsPerMinute: config.get<number>('apis.sportsDataIO.rateLimit'),
        requestsPerDay: 1000 // Default value since not in config
      }
    };

    this.logger.info('SportsDataIO connector initialized', {
      baseUrl: this.baseUrl,
      rateLimit: this.sportsDataConfig.rateLimit
    });
  }

  /**
   * Fetch live scores for current games
   */
  async fetchLiveScores(): Promise<GameScore[]> {
    try {
      const request: APIRequest = {
        url: this.buildEndpointUrl('liveScores', { format: 'json' }),
        method: 'GET'
      };

      const response = await this.executeRequest<SportsDataIOGame[]>(request);
      return this.mapToGameScores(response.data);
    } catch (error) {
      this.logger.error('Failed to fetch live scores from SportsDataIO', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch live scores',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch odds and spreads for games
   */
  async fetchOddsAndSpreads(season: number): Promise<BettingLine[]> {
    try {
      const request: APIRequest = {
        url: this.buildEndpointUrl('odds', { format: 'json', season: season.toString() }),
        method: 'GET'
      };

      const response = await this.executeRequest<SportsDataIOOdds[]>(request);
      return this.mapToBettingLines(response.data);
    } catch (error) {
      this.logger.error('Failed to fetch odds from SportsDataIO', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch odds and spreads',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch player props for a specific week
   */
  async fetchPlayerProps(season: number, week: number): Promise<PlayerProp[]> {
    try {
      const request: APIRequest = {
        url: this.buildEndpointUrl('playerProps', { 
          format: 'json', 
          season: season.toString(), 
          week: week.toString() 
        }),
        method: 'GET'
      };

      const response = await this.executeRequest<any[]>(request);
      return this.mapToPlayerProps(response.data);
    } catch (error) {
      this.logger.error('Failed to fetch player props from SportsDataIO', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch player props',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch injury reports for a specific week
   */
  async fetchInjuryReports(season: number, week: number): Promise<InjuryReport[]> {
    try {
      const request: APIRequest = {
        url: this.buildEndpointUrl('injuries', { 
          format: 'json', 
          season: season.toString(), 
          week: week.toString() 
        }),
        method: 'GET'
      };

      const response = await this.executeRequest<SportsDataIOInjury[]>(request);
      return this.mapToInjuryReports(response.data);
    } catch (error) {
      this.logger.error('Failed to fetch injury reports from SportsDataIO', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch injury reports',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch teams data
   */
  async fetchTeams(): Promise<Team[]> {
    try {
      const request: APIRequest = {
        url: this.buildEndpointUrl('teams', { format: 'json' }),
        method: 'GET'
      };

      const response = await this.executeRequest<SportsDataIOTeam[]>(request);
      return this.mapToTeams(response.data);
    } catch (error) {
      this.logger.error('Failed to fetch teams from SportsDataIO', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch teams',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch players data
   */
  async fetchPlayers(): Promise<Player[]> {
    try {
      const request: APIRequest = {
        url: this.buildEndpointUrl('players', { format: 'json' }),
        method: 'GET'
      };

      const response = await this.executeRequest<SportsDataIOPlayer[]>(request);
      return this.mapToPlayers(response.data);
    } catch (error) {
      this.logger.error('Failed to fetch players from SportsDataIO', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch players',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch player statistics for a specific season and week
   */
  async fetchPlayerStats(season: number, week: number): Promise<SportsDataIOPlayerStats[]> {
    try {
      const request: APIRequest = {
        url: this.buildEndpointUrl('playerStats', { 
          format: 'json', 
          season: season.toString(), 
          week: week.toString() 
        }),
        method: 'GET'
      };

      const response = await this.executeRequest<SportsDataIOPlayerStats[]>(request);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch player stats from SportsDataIO', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch player statistics',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch games for a specific season
   */
  async fetchGames(season: number): Promise<SportsDataIOGame[]> {
    try {
      const request: APIRequest = {
        url: this.buildEndpointUrl('games', { 
          format: 'json', 
          season: season.toString() 
        }),
        method: 'GET'
      };

      const response = await this.executeRequest<SportsDataIOGame[]>(request);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch games from SportsDataIO', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch games',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Build endpoint URL with parameters
   */
  private buildEndpointUrl(endpoint: keyof typeof this.sportsDataConfig.endpoints, params: Record<string, string>): string {
    let url = this.sportsDataConfig.endpoints[endpoint];
    
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value);
    });

    return url;
  }

  /**
   * Map SportsDataIO games to internal GameScore format
   */
  private mapToGameScores(games: SportsDataIOGame[]): GameScore[] {
    return games.map(game => ({
      gameId: game.GlobalGameID.toString(),
      homeScore: game.HomeScore || 0,
      awayScore: game.AwayScore || 0,
      quarter: game.Quarter || 1,
      timeRemaining: {
        quarter: game.Quarter || 1,
        minutes: game.TimeRemainingMinutes || 0,
        seconds: game.TimeRemainingSeconds || 0
      },
      lastUpdated: SportsDataIOMapper.parseDate(game.Updated),
      final: game.Status.toLowerCase() === 'final' || game.IsClosed
    }));
  }

  /**
   * Map SportsDataIO odds to internal BettingLine format
   */
  private mapToBettingLines(odds: SportsDataIOOdds[]): BettingLine[] {
    return odds.map(odd => ({
      gameId: odd.GlobalGameID.toString(),
      sportsbook: 'SportsDataIO',
      spread: {
        home: -(odd.PointSpread || 0),
        away: odd.PointSpread || 0,
        homeOdds: odd.PointSpreadHomeTeamMoneyLine || -110,
        awayOdds: odd.PointSpreadAwayTeamMoneyLine || -110
      },
      total: {
        line: odd.OverUnder || 0,
        overOdds: odd.OverPayout || -110,
        underOdds: odd.UnderPayout || -110
      },
      moneyline: {
        home: odd.MoneyLineHomeTeamMoneyLine || 0,
        away: odd.MoneyLineAwayTeamMoneyLine || 0
      },
      lastUpdated: SportsDataIOMapper.parseDate(odd.Updated)
    }));
  }

  /**
   * Map SportsDataIO data to internal PlayerProp format
   */
  private mapToPlayerProps(props: any[]): PlayerProp[] {
    // Note: SportsDataIO may not have a dedicated player props endpoint
    // This is a placeholder implementation that would need to be adjusted
    // based on the actual API response structure
    return props.map((prop, index) => ({
      id: `sportsdata-prop-${index}`,
      playerId: prop.PlayerID?.toString() || '',
      type: prop.PropType || 'passing_yards',
      line: prop.Line || 0,
      overOdds: prop.OverOdds || -110,
      underOdds: prop.UnderOdds || -110,
      available: prop.Available !== false,
      lastUpdated: new Date()
    }));
  }

  /**
   * Map SportsDataIO injuries to internal InjuryReport format
   */
  private mapToInjuryReports(injuries: SportsDataIOInjury[]): InjuryReport[] {
    return injuries.map(injury => ({
      playerId: injury.PlayerID.toString(),
      status: SportsDataIOMapper.mapInjuryStatus(injury.Status),
      bodyPart: injury.BodyPart,
      description: injury.PracticeDescription || injury.Status,
      lastUpdated: SportsDataIOMapper.parseDate(injury.Updated),
      severity: this.mapInjurySeverity(injury.Status)
    }));
  }

  /**
   * Map SportsDataIO teams to internal Team format
   */
  private mapToTeams(teams: SportsDataIOTeam[]): Team[] {
    return teams.map(team => ({
      id: team.GlobalTeamID.toString(),
      name: team.Name,
      abbreviation: team.Key,
      city: team.City,
      conference: team.Conference,
      division: team.Division,
      logo: team.WikipediaLogoUrl || '',
      primaryColor: team.PrimaryColor,
      secondaryColor: team.SecondaryColor,
      roster: [], // Would need separate API call to populate
      coaching: {
        headCoach: {
          id: `${team.TeamID}-hc`,
          name: team.HeadCoach,
          position: 'Head Coach',
          experience: 0,
          previousTeams: []
        },
        offensiveCoordinator: {
          id: `${team.TeamID}-oc`,
          name: team.OffensiveCoordinator || 'Unknown',
          position: 'Offensive Coordinator',
          experience: 0,
          previousTeams: []
        },
        defensiveCoordinator: {
          id: `${team.TeamID}-dc`,
          name: team.DefensiveCoordinator || 'Unknown',
          position: 'Defensive Coordinator',
          experience: 0,
          previousTeams: []
        },
        specialTeamsCoordinator: {
          id: `${team.TeamID}-st`,
          name: 'Unknown',
          position: 'Special Teams Coordinator',
          experience: 0,
          previousTeams: []
        },
        assistants: []
      },
      statistics: {
        season: new Date().getFullYear(),
        games: 0,
        wins: 0,
        losses: 0,
        pointsPerGame: 0,
        yardsPerGame: 0,
        passingYardsPerGame: 0,
        rushingYardsPerGame: 0,
        turnoversPerGame: 0,
        thirdDownConversion: 0,
        redZoneEfficiency: 0,
        pointsAllowedPerGame: 0,
        yardsAllowedPerGame: 0,
        passingYardsAllowedPerGame: 0,
        rushingYardsAllowedPerGame: 0,
        takeawaysPerGame: 0,
        thirdDownDefense: 0,
        redZoneDefense: 0,
        fieldGoalPercentage: 0,
        puntAverage: 0,
        kickReturnAverage: 0,
        puntReturnAverage: 0,
        strengthOfSchedule: 0,
        powerRating: 0,
        eloRating: 1500
      },
      homeVenue: team.StadiumID.toString()
    }));
  }

  /**
   * Map SportsDataIO players to internal Player format
   */
  private mapToPlayers(players: SportsDataIOPlayer[]): Player[] {
    return players.map(player => ({
      id: player.GlobalPlayerID.toString(),
      name: player.Name,
      jerseyNumber: player.Number,
      position: SportsDataIOMapper.mapPosition(player.Position),
      height: SportsDataIOMapper.parseHeight(player.Height),
      weight: player.Weight,
      age: player.Age,
      experience: player.Experience,
      college: player.College,
      injuryStatus: SportsDataIOMapper.mapInjuryStatus(player.InjuryStatus || 'healthy'),
      statistics: {
        season: new Date().getFullYear(),
        games: 0,
        gamesStarted: 0
      },
      props: []
    }));
  }

  /**
   * Map injury status to severity
   */
  private mapInjurySeverity(status: string): 'minor' | 'moderate' | 'major' {
    switch (status.toLowerCase()) {
      case 'questionable':
        return 'minor';
      case 'doubtful':
        return 'moderate';
      case 'out':
      case 'ir':
      case 'pup':
        return 'major';
      default:
        return 'minor';
    }
  }

  /**
   * Handle SportsDataIO specific error codes
   */
  protected async performRequest<T>(request: APIRequest): Promise<APIResponse<T>> {
    try {
      const response = await super.performRequest<T>(request);
      
      // Handle SportsDataIO specific response format
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        const sportsDataResponse = response.data as any;
        if (!sportsDataResponse.success) {
          throw new APIError(
            sportsDataResponse.message || 'SportsDataIO API error',
            response.status,
            sportsDataResponse,
            false
          );
        }
      }

      return response;
    } catch (error) {
      if (error instanceof APIError) {
        // Handle specific SportsDataIO error codes
        if (error.statusCode === 401) {
          throw new APIError(
            'Invalid SportsDataIO API key',
            401,
            error.response,
            false
          );
        } else if (error.statusCode === 403) {
          throw new APIError(
            'SportsDataIO API access forbidden - check subscription',
            403,
            error.response,
            false
          );
        } else if (error.statusCode === 429) {
          throw new APIError(
            'SportsDataIO rate limit exceeded',
            429,
            error.response,
            true
          );
        }
      }
      throw error;
    }
  }

  /**
   * Perform health check specific to SportsDataIO
   */
  protected async performHealthCheck(): Promise<void> {
    try {
      // Try to fetch teams as a health check
      const request: APIRequest = {
        url: this.buildEndpointUrl('teams', { format: 'json' }),
        method: 'GET'
      };

      await this.performRequest(request);
      this.logger.info('SportsDataIO health check passed');
    } catch (error) {
      this.logger.error('SportsDataIO health check failed', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'SportsDataIO health check failed',
        undefined,
        error,
        false
      );
    }
  }
}
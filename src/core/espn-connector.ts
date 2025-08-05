import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { Config } from './config';
import { Logger } from './logger';
import { HttpAPIConnector } from './http-api-connector';
import { APIRequest, APIResponse, APIError } from '../types/api.types';
import {
  ESPNConfig,
  ESPNResponse,
  ESPNEvent,
  ESPNTeam,
  ESPNCompetitor,
  ESPNMapper
} from '../types/espn.types';
import { GameScore } from '../types/game.types';
import { Team } from '../types/team.types';

/**
 * ESPN API connector for college football data
 */
@injectable()
export class ESPNConnector extends HttpAPIConnector {
  private readonly espnConfig: ESPNConfig;

  constructor(
    @inject(TYPES.Config) config: Config,
    @inject(TYPES.Logger) logger: Logger
  ) {
    const baseUrl = config.get<string>('apis.espn.baseUrl');
    
    const defaultHeaders = {
      'Accept': 'application/json',
      'User-Agent': 'Football-Analytics-System/1.0'
    };

    super(config, logger, 'ESPN', baseUrl, defaultHeaders);

    this.espnConfig = {
      baseUrl,
      endpoints: {
        collegeFootball: {
          scoreboard: '/college-football/scoreboard',
          teams: '/college-football/teams',
          games: '/college-football/games',
          rankings: '/college-football/rankings',
          news: '/college-football/news'
        },
        nfl: {
          scoreboard: '/nfl/scoreboard',
          teams: '/nfl/teams',
          games: '/nfl/games',
          news: '/nfl/news'
        }
      },
      rateLimit: {
        requestsPerMinute: config.get<number>('apis.espn.rateLimit')
      }
    };

    this.logger.info('ESPN connector initialized', {
      baseUrl: this.baseUrl,
      rateLimit: this.espnConfig.rateLimit
    });
  }

  /**
   * Fetch college football scoreboard data
   */
  async fetchCollegeFootballScoreboard(date?: string): Promise<GameScore[]> {
    try {
      const params = new URLSearchParams();
      if (date) {
        params.append('dates', date);
      }

      const url = `${this.espnConfig.endpoints.collegeFootball.scoreboard}${params.toString() ? '?' + params.toString() : ''}`;
      
      const request: APIRequest = {
        url,
        method: 'GET'
      };

      const response = await this.executeRequest<ESPNResponse<any>>(request);
      return this.mapEventsToGameScores(response.data.events || []);
    } catch (error) {
      this.logger.error('Failed to fetch college football scoreboard from ESPN', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch college football scoreboard',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch NFL scoreboard data
   */
  async fetchNFLScoreboard(date?: string): Promise<GameScore[]> {
    try {
      const params = new URLSearchParams();
      if (date) {
        params.append('dates', date);
      }

      const url = `${this.espnConfig.endpoints.nfl.scoreboard}${params.toString() ? '?' + params.toString() : ''}`;
      
      const request: APIRequest = {
        url,
        method: 'GET'
      };

      const response = await this.executeRequest<ESPNResponse<any>>(request);
      return this.mapEventsToGameScores(response.data.events || []);
    } catch (error) {
      this.logger.error('Failed to fetch NFL scoreboard from ESPN', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch NFL scoreboard',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch college football teams
   */
  async fetchCollegeFootballTeams(): Promise<Team[]> {
    try {
      const request: APIRequest = {
        url: this.espnConfig.endpoints.collegeFootball.teams,
        method: 'GET'
      };

      const response = await this.executeRequest<any>(request);
      return this.mapESPNTeamsToInternal(response.data.sports?.[0]?.leagues?.[0]?.teams || []);
    } catch (error) {
      this.logger.error('Failed to fetch college football teams from ESPN', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch college football teams',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch NFL teams
   */
  async fetchNFLTeams(): Promise<Team[]> {
    try {
      const request: APIRequest = {
        url: this.espnConfig.endpoints.nfl.teams,
        method: 'GET'
      };

      const response = await this.executeRequest<any>(request);
      return this.mapESPNTeamsToInternal(response.data.sports?.[0]?.leagues?.[0]?.teams || []);
    } catch (error) {
      this.logger.error('Failed to fetch NFL teams from ESPN', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch NFL teams',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch college football games for a specific date range
   */
  async fetchCollegeFootballGames(startDate: string, endDate?: string): Promise<ESPNEvent[]> {
    try {
      const params = new URLSearchParams();
      params.append('dates', startDate);
      if (endDate) {
        params.append('endDate', endDate);
      }

      const url = `${this.espnConfig.endpoints.collegeFootball.games}?${params.toString()}`;
      
      const request: APIRequest = {
        url,
        method: 'GET'
      };

      const response = await this.executeRequest<ESPNResponse<any>>(request);
      return response.data.events || [];
    } catch (error) {
      this.logger.error('Failed to fetch college football games from ESPN', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch college football games',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch NFL games for a specific date range
   */
  async fetchNFLGames(startDate: string, endDate?: string): Promise<ESPNEvent[]> {
    try {
      const params = new URLSearchParams();
      params.append('dates', startDate);
      if (endDate) {
        params.append('endDate', endDate);
      }

      const url = `${this.espnConfig.endpoints.nfl.games}?${params.toString()}`;
      
      const request: APIRequest = {
        url,
        method: 'GET'
      };

      const response = await this.executeRequest<ESPNResponse<any>>(request);
      return response.data.events || [];
    } catch (error) {
      this.logger.error('Failed to fetch NFL games from ESPN', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch NFL games',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch college football rankings
   */
  async fetchCollegeFootballRankings(): Promise<any[]> {
    try {
      const request: APIRequest = {
        url: this.espnConfig.endpoints.collegeFootball.rankings,
        method: 'GET'
      };

      const response = await this.executeRequest<any>(request);
      return response.data.rankings || [];
    } catch (error) {
      this.logger.error('Failed to fetch college football rankings from ESPN', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch college football rankings',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch news for college football
   */
  async fetchCollegeFootballNews(limit: number = 10): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());

      const url = `${this.espnConfig.endpoints.collegeFootball.news}?${params.toString()}`;
      
      const request: APIRequest = {
        url,
        method: 'GET'
      };

      const response = await this.executeRequest<any>(request);
      return response.data.articles || [];
    } catch (error) {
      this.logger.error('Failed to fetch college football news from ESPN', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch college football news',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch news for NFL
   */
  async fetchNFLNews(limit: number = 10): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());

      const url = `${this.espnConfig.endpoints.nfl.news}?${params.toString()}`;
      
      const request: APIRequest = {
        url,
        method: 'GET'
      };

      const response = await this.executeRequest<any>(request);
      return response.data.articles || [];
    } catch (error) {
      this.logger.error('Failed to fetch NFL news from ESPN', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch NFL news',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Map ESPN events to internal GameScore format
   */
  private mapEventsToGameScores(events: ESPNEvent[]): GameScore[] {
    return events.map(event => ESPNMapper.mapGameScoreToInternal(event));
  }

  /**
   * Map ESPN teams to internal Team format
   */
  private mapESPNTeamsToInternal(teams: any[]): Team[] {
    return teams.map(teamData => {
      const team = teamData.team;
      // Create a mock competitor for the mapping function
      const mockCompetitor: ESPNCompetitor = {
        id: team.id,
        uid: team.uid,
        type: 'team',
        order: 1,
        homeAway: 'home' as const,
        team: team,
        score: '0'
      };
      
      return ESPNMapper.mapTeamToInternal(team, mockCompetitor);
    });
  }

  /**
   * Handle ESPN specific error codes and response formats
   */
  protected async performRequest<T>(request: APIRequest): Promise<APIResponse<T>> {
    try {
      const response = await super.performRequest<T>(request);
      
      // ESPN API sometimes returns errors in the response body even with 200 status
      if (response.data && typeof response.data === 'object' && 'error' in response.data) {
        const errorData = response.data as any;
        throw new APIError(
          errorData.error.message || 'ESPN API error',
          response.status,
          errorData,
          false
        );
      }

      return response;
    } catch (error) {
      if (error instanceof APIError) {
        // Handle specific ESPN error codes
        if (error.statusCode === 400) {
          throw new APIError(
            'Invalid request parameters for ESPN API',
            400,
            error.response,
            false
          );
        } else if (error.statusCode === 404) {
          throw new APIError(
            'ESPN API endpoint not found',
            404,
            error.response,
            false
          );
        } else if (error.statusCode === 429) {
          throw new APIError(
            'ESPN API rate limit exceeded',
            429,
            error.response,
            true
          );
        } else if (error.statusCode === 503) {
          throw new APIError(
            'ESPN API service unavailable',
            503,
            error.response,
            true
          );
        }
      }
      throw error;
    }
  }

  /**
   * Perform health check specific to ESPN API
   */
  protected async performHealthCheck(): Promise<void> {
    try {
      // Try to fetch college football scoreboard as a health check
      const request: APIRequest = {
        url: this.espnConfig.endpoints.collegeFootball.scoreboard,
        method: 'GET'
      };

      await this.performRequest(request);
      this.logger.info('ESPN health check passed');
    } catch (error) {
      this.logger.error('ESPN health check failed', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'ESPN health check failed',
        undefined,
        error,
        false
      );
    }
  }

  /**
   * Get current rate limit information
   */
  getRateLimitInfo() {
    return {
      ...this.getRateLimit(),
      requestsPerMinute: this.espnConfig.rateLimit.requestsPerMinute
    };
  }

  /**
   * Parse ESPN date format to JavaScript Date
   */
  private parseESPNDate(dateString: string): Date {
    return ESPNMapper.parseDate(dateString);
  }

  /**
   * Build query parameters for ESPN API requests
   */
  private buildQueryParams(params: Record<string, string | number>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Extract team statistics from ESPN competition data
   */
  private extractTeamStatistics(competitor: ESPNCompetitor): any {
    const stats: any = {};
    
    if (competitor.statistics) {
      competitor.statistics.forEach(stat => {
        stats[stat.abbreviation] = {
          value: parseFloat(stat.displayValue) || 0,
          rank: stat.rankDisplayValue ? parseInt(stat.rankDisplayValue, 10) : undefined
        };
      });
    }

    return stats;
  }

  /**
   * Extract player leaders from ESPN competition data
   */
  private extractPlayerLeaders(competitor: ESPNCompetitor): any[] {
    const leaders: any[] = [];
    
    if (competitor.leaders) {
      competitor.leaders.forEach(leaderCategory => {
        leaderCategory.leaders.forEach(leader => {
          leaders.push({
            category: leaderCategory.name,
            player: {
              id: leader.athlete.id,
              name: leader.athlete.displayName,
              position: leader.athlete.position.abbreviation,
              jersey: leader.athlete.jersey
            },
            value: leader.value,
            displayValue: leader.displayValue
          });
        });
      });
    }

    return leaders;
  }
}
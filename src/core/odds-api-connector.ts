import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { Config } from './config';
import { Logger } from './logger';
import { HttpAPIConnector } from './http-api-connector';
import { APIRequest, APIResponse, APIError } from '../types/api.types';
import { BettingLine } from '../types/game.types';

/**
 * The Odds API response structure
 */
interface OddsAPIResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsAPIBookmaker[];
}

/**
 * Bookmaker data structure
 */
interface OddsAPIBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsAPIMarket[];
}

/**
 * Market data structure
 */
interface OddsAPIMarket {
  key: string; // 'h2h' for moneyline, 'spreads' for point spreads, 'totals' for over/under
  last_update: string;
  outcomes: OddsAPIOutcome[];
}

/**
 * Outcome data structure
 */
interface OddsAPIOutcome {
  name: string;
  price: number; // American odds format
  point?: number; // For spreads and totals
}

/**
 * Odds API configuration
 */
interface OddsAPIConfig {
  apiKey: string;
  baseUrl: string;
  endpoints: {
    sports: string;
    odds: string;
    scores: string;
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerMonth: number;
  };
}

/**
 * The Odds API connector for real-time betting lines
 */
@injectable()
export class OddsAPIConnector extends HttpAPIConnector {
  private readonly oddsConfig: OddsAPIConfig;

  constructor(
    @inject(TYPES.Config) config: Config,
    @inject(TYPES.Logger) logger: Logger
  ) {
    const apiKey = config.get<string>('apis.oddsAPI.apiKey');
    const baseUrl = config.get<string>('apis.oddsAPI.baseUrl');
    
    const defaultHeaders = {
      'Accept': 'application/json',
      'User-Agent': 'Football-Analytics-System/1.0'
    };

    super(config, logger, 'OddsAPI', baseUrl, defaultHeaders);

    this.oddsConfig = {
      apiKey,
      baseUrl,
      endpoints: {
        sports: '/sports',
        odds: '/odds',
        scores: '/scores'
      },
      rateLimit: {
        requestsPerMinute: config.get<number>('apis.oddsAPI.rateLimit'),
        requestsPerMonth: 500 // Free tier limit
      }
    };

    this.logger.info('Odds API connector initialized', {
      baseUrl: this.baseUrl,
      rateLimit: this.oddsConfig.rateLimit
    });
  }

  /**
   * Fetch NFL betting lines
   */
  async fetchNFLOdds(): Promise<BettingLine[]> {
    try {
      const params = new URLSearchParams({
        apiKey: this.oddsConfig.apiKey,
        sport: 'americanfootball_nfl',
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        dateFormat: 'iso'
      });

      const request: APIRequest = {
        url: `${this.oddsConfig.endpoints.odds}?${params.toString()}`,
        method: 'GET'
      };

      const response = await this.executeRequest<OddsAPIResponse[]>(request);
      return this.mapOddsResponseToBettingLines(response.data);
    } catch (error) {
      this.logger.error('Failed to fetch NFL odds', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch NFL odds',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch college football betting lines
   */
  async fetchCollegeFootballOdds(): Promise<BettingLine[]> {
    try {
      const params = new URLSearchParams({
        apiKey: this.oddsConfig.apiKey,
        sport: 'americanfootball_ncaaf',
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        dateFormat: 'iso'
      });

      const request: APIRequest = {
        url: `${this.oddsConfig.endpoints.odds}?${params.toString()}`,
        method: 'GET'
      };

      const response = await this.executeRequest<OddsAPIResponse[]>(request);
      return this.mapOddsResponseToBettingLines(response.data);
    } catch (error) {
      this.logger.error('Failed to fetch college football odds', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch college football odds',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch odds for specific games
   */
  async fetchGameOdds(gameIds: string[], sport: 'nfl' | 'ncaaf' = 'nfl'): Promise<BettingLine[]> {
    try {
      const sportKey = sport === 'nfl' ? 'americanfootball_nfl' : 'americanfootball_ncaaf';
      const params = new URLSearchParams({
        apiKey: this.oddsConfig.apiKey,
        sport: sportKey,
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        dateFormat: 'iso',
        eventIds: gameIds.join(',')
      });

      const request: APIRequest = {
        url: `${this.oddsConfig.endpoints.odds}?${params.toString()}`,
        method: 'GET'
      };

      const response = await this.executeRequest<OddsAPIResponse[]>(request);
      return this.mapOddsResponseToBettingLines(response.data);
    } catch (error) {
      this.logger.error('Failed to fetch game odds', error instanceof Error ? error : new Error(String(error)), {
        gameIds,
        sport
      });
      throw new APIError(
        'Failed to fetch game odds',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch available sports
   */
  async fetchAvailableSports(): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        apiKey: this.oddsConfig.apiKey
      });

      const request: APIRequest = {
        url: `${this.oddsConfig.endpoints.sports}?${params.toString()}`,
        method: 'GET'
      };

      const response = await this.executeRequest<any[]>(request);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch available sports', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Failed to fetch available sports',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch historical odds (if available)
   */
  async fetchHistoricalOdds(sport: 'nfl' | 'ncaaf', date: string): Promise<BettingLine[]> {
    try {
      const sportKey = sport === 'nfl' ? 'americanfootball_nfl' : 'americanfootball_ncaaf';
      const params = new URLSearchParams({
        apiKey: this.oddsConfig.apiKey,
        sport: sportKey,
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        dateFormat: 'iso',
        date: date
      });

      const request: APIRequest = {
        url: `${this.oddsConfig.endpoints.odds}?${params.toString()}`,
        method: 'GET'
      };

      const response = await this.executeRequest<OddsAPIResponse[]>(request);
      return this.mapOddsResponseToBettingLines(response.data);
    } catch (error) {
      this.logger.error('Failed to fetch historical odds', error instanceof Error ? error : new Error(String(error)), {
        sport,
        date
      });
      throw new APIError(
        'Failed to fetch historical odds',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Map Odds API response to internal BettingLine format
   */
  private mapOddsResponseToBettingLines(oddsData: OddsAPIResponse[]): BettingLine[] {
    const bettingLines: BettingLine[] = [];

    oddsData.forEach(game => {
      game.bookmakers.forEach(bookmaker => {
        const moneylineMarket = bookmaker.markets.find(m => m.key === 'h2h');
        const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');
        const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');

        // Extract moneyline odds
        let homeMoneyline = 0;
        let awayMoneyline = 0;
        if (moneylineMarket) {
          const homeOutcome = moneylineMarket.outcomes.find(o => o.name === game.home_team);
          const awayOutcome = moneylineMarket.outcomes.find(o => o.name === game.away_team);
          homeMoneyline = homeOutcome?.price || 0;
          awayMoneyline = awayOutcome?.price || 0;
        }

        // Extract spread odds
        let homeSpread = 0;
        let awaySpread = 0;
        let homeSpreadOdds = -110;
        let awaySpreadOdds = -110;
        if (spreadsMarket) {
          const homeOutcome = spreadsMarket.outcomes.find(o => o.name === game.home_team);
          const awayOutcome = spreadsMarket.outcomes.find(o => o.name === game.away_team);
          if (homeOutcome) {
            homeSpread = homeOutcome.point || 0;
            homeSpreadOdds = homeOutcome.price;
          }
          if (awayOutcome) {
            awaySpread = awayOutcome.point || 0;
            awaySpreadOdds = awayOutcome.price;
          }
        }

        // Extract total odds
        let totalLine = 0;
        let overOdds = -110;
        let underOdds = -110;
        if (totalsMarket) {
          const overOutcome = totalsMarket.outcomes.find(o => o.name === 'Over');
          const underOutcome = totalsMarket.outcomes.find(o => o.name === 'Under');
          if (overOutcome) {
            totalLine = overOutcome.point || 0;
            overOdds = overOutcome.price;
          }
          if (underOutcome) {
            underOdds = underOutcome.price;
          }
        }

        const bettingLine: BettingLine = {
          gameId: game.id,
          sportsbook: bookmaker.title,
          spread: {
            home: homeSpread,
            away: awaySpread,
            homeOdds: homeSpreadOdds,
            awayOdds: awaySpreadOdds
          },
          total: {
            line: totalLine,
            overOdds: overOdds,
            underOdds: underOdds
          },
          moneyline: {
            home: homeMoneyline,
            away: awayMoneyline
          },
          lastUpdated: new Date(bookmaker.last_update)
        };

        bettingLines.push(bettingLine);
      });
    });

    return bettingLines;
  }

  /**
   * Get current rate limit usage
   */
  getRateLimitUsage() {
    return {
      ...this.getRateLimit(),
      requestsPerMinute: this.oddsConfig.rateLimit.requestsPerMinute,
      requestsPerMonth: this.oddsConfig.rateLimit.requestsPerMonth
    };
  }

  /**
   * Handle Odds API specific error codes
   */
  protected async performRequest<T>(request: APIRequest): Promise<APIResponse<T>> {
    try {
      const response = await super.performRequest<T>(request);
      
      // The Odds API returns errors in different formats
      if (response.data && typeof response.data === 'object' && 'message' in response.data) {
        const errorData = response.data as any;
        if (errorData.message && typeof errorData.message === 'string' && errorData.message.includes('error')) {
          throw new APIError(
            errorData.message,
            response.status,
            errorData,
            false
          );
        }
      }

      return response;
    } catch (error) {
      if (error instanceof APIError) {
        // Handle specific Odds API error codes
        if (error.statusCode === 401) {
          throw new APIError(
            'Invalid Odds API key',
            401,
            error.response,
            false
          );
        } else if (error.statusCode === 422) {
          throw new APIError(
            'Invalid request parameters for Odds API',
            422,
            error.response,
            false
          );
        } else if (error.statusCode === 429) {
          throw new APIError(
            'Odds API rate limit exceeded',
            429,
            error.response,
            true
          );
        } else if (error.statusCode === 500) {
          throw new APIError(
            'Odds API server error',
            500,
            error.response,
            true
          );
        }
      }
      throw error;
    }
  }

  /**
   * Perform health check specific to Odds API
   */
  protected async performHealthCheck(): Promise<void> {
    try {
      // Test by fetching available sports
      const params = new URLSearchParams({
        apiKey: this.oddsConfig.apiKey
      });

      const request: APIRequest = {
        url: `${this.oddsConfig.endpoints.sports}?${params.toString()}`,
        method: 'GET'
      };

      await this.performRequest(request);
      this.logger.info('Odds API health check passed');
    } catch (error) {
      this.logger.error('Odds API health check failed', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Odds API health check failed',
        undefined,
        error,
        false
      );
    }
  }

  /**
   * Convert American odds to decimal odds
   */
  private americanToDecimal(americanOdds: number): number {
    if (americanOdds > 0) {
      return (americanOdds / 100) + 1;
    } else {
      return (100 / Math.abs(americanOdds)) + 1;
    }
  }

  /**
   * Convert American odds to implied probability
   */
  private americanToImpliedProbability(americanOdds: number): number {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  }

  /**
   * Calculate expected value for a bet
   */
  calculateExpectedValue(odds: number, trueProbability: number): number {
    const impliedProbability = this.americanToImpliedProbability(odds);
    const decimalOdds = this.americanToDecimal(odds);
    
    return (trueProbability * (decimalOdds - 1)) - ((1 - trueProbability) * 1);
  }

  /**
   * Find arbitrage opportunities across different sportsbooks
   */
  findArbitrageOpportunities(bettingLines: BettingLine[]): any[] {
    const arbitrageOpportunities: any[] = [];
    
    // Group betting lines by game
    const gameLines = new Map<string, BettingLine[]>();
    bettingLines.forEach(line => {
      if (!gameLines.has(line.gameId)) {
        gameLines.set(line.gameId, []);
      }
      gameLines.get(line.gameId)!.push(line);
    });

    // Check for arbitrage opportunities in each game
    gameLines.forEach((lines, gameId) => {
      if (lines.length < 2) return; // Need at least 2 sportsbooks

      // Check moneyline arbitrage
      const bestHomeOdds = Math.max(...lines.map(l => l.moneyline.home));
      const bestAwayOdds = Math.max(...lines.map(l => l.moneyline.away));
      
      const homeImplied = this.americanToImpliedProbability(bestHomeOdds);
      const awayImplied = this.americanToImpliedProbability(bestAwayOdds);
      const totalImplied = homeImplied + awayImplied;

      if (totalImplied < 1) {
        arbitrageOpportunities.push({
          gameId,
          type: 'moneyline',
          profit: ((1 / totalImplied) - 1) * 100,
          bets: [
            {
              side: 'home',
              odds: bestHomeOdds,
              stake: homeImplied / totalImplied,
              sportsbook: lines.find(l => l.moneyline.home === bestHomeOdds)?.sportsbook
            },
            {
              side: 'away',
              odds: bestAwayOdds,
              stake: awayImplied / totalImplied,
              sportsbook: lines.find(l => l.moneyline.away === bestAwayOdds)?.sportsbook
            }
          ]
        });
      }
    });

    return arbitrageOpportunities;
  }
}
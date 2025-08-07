import { Game } from '../models/Game';
import { Team } from '../models/Team';
import { Player } from '../models/Player';
import { GameProbabilities } from '../models/GameProbabilities';

/**
 * Demo data seeder for local development
 * Creates sample games, teams, and players for testing
 */
export class DemoDataSeeder {
  private teams: Team[] = [];
  private players: Player[] = [];
  private games: Game[] = [];

  constructor() {
    this.initializeTeams();
    this.initializePlayers();
    this.initializeGames();
  }

  private initializeTeams(): void {
    this.teams = [
      new Team({
        id: '1',
        name: 'Alabama Crimson Tide',
        abbreviation: 'ALA',
        conference: 'SEC',
        division: 'West',
        logoUrl: 'https://example.com/alabama-logo.png',
        primaryColor: '#9E1B32',
        secondaryColor: '#FFFFFF',
        venue: 'Bryant-Denny Stadium',
        city: 'Tuscaloosa',
        state: 'Alabama'
      }),
      new Team({
        id: '2',
        name: 'Georgia Bulldogs',
        abbreviation: 'UGA',
        conference: 'SEC',
        division: 'East',
        logoUrl: 'https://example.com/georgia-logo.png',
        primaryColor: '#BA0C2F',
        secondaryColor: '#000000',
        venue: 'Sanford Stadium',
        city: 'Athens',
        state: 'Georgia'
      }),
      new Team({
        id: '3',
        name: 'Michigan Wolverines',
        abbreviation: 'MICH',
        conference: 'Big Ten',
        division: 'East',
        logoUrl: 'https://example.com/michigan-logo.png',
        primaryColor: '#00274C',
        secondaryColor: '#FFCB05',
        venue: 'Michigan Stadium',
        city: 'Ann Arbor',
        state: 'Michigan'
      }),
      new Team({
        id: '4',
        name: 'Texas Longhorns',
        abbreviation: 'TEX',
        conference: 'Big 12',
        division: '',
        logoUrl: 'https://example.com/texas-logo.png',
        primaryColor: '#BF5700',
        secondaryColor: '#FFFFFF',
        venue: 'Darrell K Royal Stadium',
        city: 'Austin',
        state: 'Texas'
      })
    ];
  }

  private initializePlayers(): void {
    this.players = [
      // Alabama players
      new Player({
        id: '1',
        name: 'Bryce Young',
        teamId: '1',
        position: 'QB',
        jerseyNumber: 9,
        height: 72, // 6'0"
        weight: 194,
        year: 'Junior',
        hometown: 'Pasadena, CA'
      }),
      new Player({
        id: '2',
        name: 'Jahmyr Gibbs',
        teamId: '1',
        position: 'RB',
        jerseyNumber: 1,
        height: 69, // 5'9"
        weight: 200,
        year: 'Junior',
        hometown: 'Dalton, GA'
      }),
      // Georgia players
      new Player({
        id: '3',
        name: 'Stetson Bennett',
        teamId: '2',
        position: 'QB',
        jerseyNumber: 13,
        height: 71, // 5'11"
        weight: 190,
        year: 'Senior',
        hometown: 'Blackshear, GA'
      }),
      new Player({
        id: '4',
        name: 'Kenny McIntosh',
        teamId: '2',
        position: 'RB',
        jerseyNumber: 6,
        height: 72, // 6'0"
        weight: 210,
        year: 'Senior',
        hometown: 'Sunrise, FL'
      })
    ];
  }

  private initializeGames(): void {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    this.games = [
      new Game({
        id: '1',
        homeTeamId: '1', // Alabama
        awayTeamId: '2', // Georgia
        scheduledTime: tomorrow,
        venue: 'Bryant-Denny Stadium',
        city: 'Tuscaloosa',
        state: 'Alabama',
        weather: {
          temperature: 75,
          humidity: 65,
          windSpeed: 8,
          conditions: 'Partly Cloudy',
          precipitation: 0
        },
        season: 2024,
        week: 8,
        gameType: 'Regular Season',
        status: 'Scheduled'
      }),
      new Game({
        id: '2',
        homeTeamId: '3', // Michigan
        awayTeamId: '4', // Texas
        scheduledTime: nextWeek,
        venue: 'Michigan Stadium',
        city: 'Ann Arbor',
        state: 'Michigan',
        weather: {
          temperature: 68,
          humidity: 70,
          windSpeed: 12,
          conditions: 'Clear',
          precipitation: 0
        },
        season: 2024,
        week: 9,
        gameType: 'Regular Season',
        status: 'Scheduled'
      })
    ];
  }

  /**
   * Get demo teams
   */
  public getTeams(): Team[] {
    return this.teams;
  }

  /**
   * Get demo players
   */
  public getPlayers(): Player[] {
    return this.players;
  }

  /**
   * Get demo games
   */
  public getGames(): Game[] {
    return this.games;
  }

  /**
   * Generate demo probabilities for a game
   */
  public generateGameProbabilities(gameId: string): GameProbabilities {
    const game = this.games.find(g => g.id === gameId);
    if (!game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }

    // Generate realistic probabilities
    const homeWinProb = 0.45 + Math.random() * 0.3; // 45-75%
    const awayWinProb = 1 - homeWinProb;

    return new GameProbabilities({
      gameId,
      homeTeamWinProbability: homeWinProb,
      awayTeamWinProbability: awayWinProb,
      overUnderProbability: {
        over: 0.48 + Math.random() * 0.04, // 48-52%
        under: 0.48 + Math.random() * 0.04
      },
      spreadProbability: {
        home: homeWinProb * 0.8, // Slightly lower than win probability
        away: awayWinProb * 0.8
      },
      confidence: 0.75 + Math.random() * 0.2, // 75-95%
      lastUpdated: new Date(),
      factors: {
        homeFieldAdvantage: 0.03,
        recentForm: Math.random() * 0.1 - 0.05, // -5% to +5%
        injuries: Math.random() * 0.05, // 0-5% impact
        weather: Math.random() * 0.02, // 0-2% impact
        motivation: Math.random() * 0.03 // 0-3% impact
      }
    });
  }

  /**
   * Generate live game updates (for WebSocket demo)
   */
  public generateLiveUpdate(gameId: string) {
    const probabilities = this.generateGameProbabilities(gameId);
    
    return {
      type: 'probability-update',
      gameId,
      timestamp: new Date().toISOString(),
      probabilities: {
        homeWin: probabilities.homeTeamWinProbability,
        awayWin: probabilities.awayTeamWinProbability,
        confidence: probabilities.confidence
      },
      gameState: {
        quarter: Math.floor(Math.random() * 4) + 1,
        timeRemaining: `${Math.floor(Math.random() * 15)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        homeScore: Math.floor(Math.random() * 35),
        awayScore: Math.floor(Math.random() * 35),
        possession: Math.random() > 0.5 ? 'home' : 'away'
      }
    };
  }

  /**
   * Seed all demo data
   */
  public async seedAll(): Promise<void> {
    console.log('🌱 Seeding demo data...');
    
    // In a real implementation, this would save to database
    console.log(`✓ Created ${this.teams.length} demo teams`);
    console.log(`✓ Created ${this.players.length} demo players`);
    console.log(`✓ Created ${this.games.length} demo games`);
    
    // Generate probabilities for all games
    this.games.forEach(game => {
      const probabilities = this.generateGameProbabilities(game.id);
      console.log(`✓ Generated probabilities for ${game.id}: Home ${(probabilities.homeTeamWinProbability * 100).toFixed(1)}%`);
    });
    
    console.log('🎉 Demo data seeding complete!');
  }
}

// Export singleton instance
export const demoDataSeeder = new DemoDataSeeder();
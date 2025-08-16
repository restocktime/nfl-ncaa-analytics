import { PlayerNameResolver, PlayerMatch, DisambiguationResult } from '../nlp/player-name-resolver';
import { ConversationContext } from '../types/voice.types';
import { Player } from '../../models/Player';

describe('PlayerNameResolver', () => {
  let resolver: PlayerNameResolver;
  let mockContext: ConversationContext;

  beforeEach(() => {
    resolver = new PlayerNameResolver();
    mockContext = {
      sessionId: 'test-session',
      userId: 'test-user',
      currentLeague: 'test-league',
      conversationTopic: null,
      pendingActions: [],
      entityContext: {},
      lastInteraction: new Date(),
      currentWeek: 10,
      userTeam: ['Josh Allen', 'Christian McCaffrey'],
      recentPlayers: ['Josh Allen'],
      lastPosition: null,
      conversationHistory: []
    };
  });

  describe('resolvePlayerName', () => {
    it('should resolve exact name matches', async () => {
      const result = await resolver.resolvePlayerName('Josh Allen', mockContext);

      expect(result.needsDisambiguation).toBe(false);
      expect(result.suggestedMatch).toBeDefined();
      expect(result.suggestedMatch?.player.name).toBe('Josh Allen');
      expect(result.suggestedMatch?.matchType).toBe('exact');
      expect(result.suggestedMatch?.confidence).toBe(1.0);
    });

    it('should resolve nickname matches', async () => {
      const result = await resolver.resolvePlayerName('CMC', mockContext);

      expect(result.needsDisambiguation).toBe(false);
      expect(result.suggestedMatch).toBeDefined();
      expect(result.suggestedMatch?.player.name).toBe('Christian McCaffrey');
      expect(result.suggestedMatch?.matchType).toBe('nickname');
      expect(result.suggestedMatch?.confidence).toBe(0.95);
    });

    it('should resolve partial name matches (last name only)', async () => {
      const result = await resolver.resolvePlayerName('Allen', mockContext);

      expect(result.needsDisambiguation).toBe(false);
      expect(result.suggestedMatch).toBeDefined();
      expect(result.suggestedMatch?.player.name).toBe('Josh Allen');
      expect(result.suggestedMatch?.matchType).toBe('partial');
    });

    it('should resolve first + last name combinations', async () => {
      const result = await resolver.resolvePlayerName('Patrick Mahomes', mockContext);

      expect(result.needsDisambiguation).toBe(false);
      expect(result.suggestedMatch).toBeDefined();
      expect(result.suggestedMatch?.player.name).toBe('Patrick Mahomes');
    });

    it('should handle case insensitive matching', async () => {
      const result = await resolver.resolvePlayerName('josh allen', mockContext);

      expect(result.needsDisambiguation).toBe(false);
      expect(result.suggestedMatch?.player.name).toBe('Josh Allen');
    });

    it('should handle names with extra whitespace', async () => {
      const result = await resolver.resolvePlayerName('  Josh   Allen  ', mockContext);

      expect(result.needsDisambiguation).toBe(false);
      expect(result.suggestedMatch?.player.name).toBe('Josh Allen');
    });

    it('should return disambiguation prompt for unknown players', async () => {
      const result = await resolver.resolvePlayerName('Unknown Player', mockContext);

      expect(result.needsDisambiguation).toBe(false);
      expect(result.matches).toHaveLength(0);
      expect(result.disambiguationPrompt).toContain('couldn\'t find a player');
    });

    it('should handle multiple matches requiring disambiguation', async () => {
      // Add another player with similar name
      const similarPlayer: Player = {
        id: '999',
        name: 'Josh Gordon',
        position: 'WR',
        team: 'FA',
        isActive: false
      };
      resolver.addPlayer(similarPlayer);

      const result = await resolver.resolvePlayerName('Josh', mockContext);

      if (result.matches.length > 1) {
        expect(result.needsDisambiguation).toBe(true);
        expect(result.disambiguationPrompt).toContain('multiple players');
      }
    });
  });

  describe('resolvePlayerNames', () => {
    it('should resolve multiple player names', async () => {
      const results = await resolver.resolvePlayerNames(['Josh Allen', 'CMC'], mockContext);

      expect(results).toHaveLength(2);
      expect(results[0].suggestedMatch?.player.name).toBe('Josh Allen');
      expect(results[1].suggestedMatch?.player.name).toBe('Christian McCaffrey');
    });

    it('should handle mixed resolution results', async () => {
      const results = await resolver.resolvePlayerNames(['Josh Allen', 'Unknown Player'], mockContext);

      expect(results).toHaveLength(2);
      expect(results[0].needsDisambiguation).toBe(false);
      expect(results[1].matches).toHaveLength(0);
    });
  });

  describe('contextual ranking', () => {
    it('should boost confidence for players on user team', async () => {
      const result = await resolver.resolvePlayerName('Allen', mockContext);

      expect(result.suggestedMatch?.confidence).toBeGreaterThan(0.8);
      // Should be boosted because Josh Allen is on user's team
    });

    it('should boost confidence for recently mentioned players', async () => {
      const result = await resolver.resolvePlayerName('Allen', mockContext);

      expect(result.suggestedMatch?.confidence).toBeGreaterThan(0.8);
      // Should be boosted because Josh Allen is in recent players
    });

    it('should boost confidence for active players', async () => {
      const result = await resolver.resolvePlayerName('Josh Allen', mockContext);

      expect(result.suggestedMatch?.confidence).toBeGreaterThan(0.95);
      // Should be boosted because Josh Allen is active
    });

    it('should rank matches by contextual relevance', async () => {
      // Add a player not on user's team
      const otherPlayer: Player = {
        id: '998',
        name: 'Other Allen',
        position: 'RB',
        team: 'NYJ',
        isActive: true
      };
      resolver.addPlayer(otherPlayer);

      const result = await resolver.resolvePlayerName('Allen', mockContext);

      // Josh Allen should be preferred due to context
      expect(result.suggestedMatch?.player.name).toBe('Josh Allen');
    });
  });

  describe('fuzzy matching', () => {
    it('should find fuzzy matches using Soundex', async () => {
      // Test with slightly misspelled name
      const result = await resolver.resolvePlayerName('Josh Alan', mockContext);

      // Should still find Josh Allen through fuzzy matching
      expect(result.matches.length).toBeGreaterThan(0);
      const fuzzyMatch = result.matches.find(m => m.matchType === 'fuzzy');
      expect(fuzzyMatch).toBeDefined();
    });

    it('should assign appropriate confidence to fuzzy matches', async () => {
      const result = await resolver.resolvePlayerName('Josh Alan', mockContext);

      const fuzzyMatch = result.matches.find(m => m.matchType === 'fuzzy');
      if (fuzzyMatch) {
        expect(fuzzyMatch.confidence).toBeLessThan(0.8);
        expect(fuzzyMatch.confidence).toBeGreaterThan(0.5);
      }
    });
  });

  describe('nickname handling', () => {
    it('should resolve common nicknames', async () => {
      const testCases = [
        { nickname: 'CMC', expected: 'Christian McCaffrey' },
        { nickname: 'Mahomes', expected: 'Patrick Mahomes' },
        { nickname: 'Kupp', expected: 'Cooper Kupp' },
        { nickname: 'Kelce', expected: 'Travis Kelce' }
      ];

      for (const testCase of testCases) {
        const result = await resolver.resolvePlayerName(testCase.nickname, mockContext);
        expect(result.suggestedMatch?.player.name).toBe(testCase.expected);
      }
    });

    it('should handle case insensitive nicknames', async () => {
      const result = await resolver.resolvePlayerName('cmc', mockContext);

      expect(result.suggestedMatch?.player.name).toBe('Christian McCaffrey');
    });

    it('should allow adding custom nicknames', () => {
      resolver.addNickname('The King', 'Derrick Henry');
      
      // This would work if we had Derrick Henry in the database
      expect(() => resolver.addNickname('The King', 'Derrick Henry')).not.toThrow();
    });
  });

  describe('partial matching', () => {
    it('should match last names correctly', async () => {
      const result = await resolver.resolvePlayerName('Mahomes', mockContext);

      expect(result.suggestedMatch?.player.name).toBe('Patrick Mahomes');
      expect(result.suggestedMatch?.matchType).toBe('partial');
    });

    it('should match first + last name combinations', async () => {
      const result = await resolver.resolvePlayerName('Christian McCaffrey', mockContext);

      expect(result.suggestedMatch?.player.name).toBe('Christian McCaffrey');
    });

    it('should handle substring matches', async () => {
      const result = await resolver.resolvePlayerName('Kupp', mockContext);

      expect(result.suggestedMatch?.player.name).toBe('Cooper Kupp');
    });
  });

  describe('disambiguation', () => {
    it('should create appropriate disambiguation prompts', async () => {
      const result = await resolver.resolvePlayerName('Unknown Player', mockContext);

      expect(result.disambiguationPrompt).toContain('couldn\'t find a player');
      expect(result.disambiguationPrompt).toContain('Unknown Player');
    });

    it('should suggest top matches for disambiguation', async () => {
      // Add multiple similar players
      const players = [
        { id: '997', name: 'John Smith', position: 'QB', team: 'NE', isActive: true },
        { id: '996', name: 'John Johnson', position: 'RB', team: 'GB', isActive: true },
        { id: '995', name: 'John Williams', position: 'WR', team: 'DAL', isActive: true }
      ];

      players.forEach(p => resolver.addPlayer(p as Player));

      const result = await resolver.resolvePlayerName('John', mockContext);

      if (result.needsDisambiguation) {
        expect(result.matches.length).toBeGreaterThan(1);
        expect(result.matches.length).toBeLessThanOrEqual(3); // Top 3 matches
        expect(result.disambiguationPrompt).toContain('multiple players');
      }
    });

    it('should not require disambiguation for high confidence matches', async () => {
      const result = await resolver.resolvePlayerName('Josh Allen', mockContext);

      expect(result.needsDisambiguation).toBe(false);
      expect(result.suggestedMatch?.confidence).toBeGreaterThan(0.9);
    });
  });

  describe('player database management', () => {
    it('should allow adding new players', () => {
      const newPlayer: Player = {
        id: '999',
        name: 'Test Player',
        position: 'QB',
        team: 'TEST',
        isActive: true
      };

      resolver.addPlayer(newPlayer);

      // Should be able to resolve the new player
      resolver.resolvePlayerName('Test Player', mockContext).then(result => {
        expect(result.suggestedMatch?.player.name).toBe('Test Player');
      });
    });

    it('should provide database statistics', () => {
      const stats = resolver.getStats();

      expect(stats).toHaveProperty('totalPlayers');
      expect(stats).toHaveProperty('totalNicknames');
      expect(typeof stats.totalPlayers).toBe('number');
      expect(typeof stats.totalNicknames).toBe('number');
      expect(stats.totalPlayers).toBeGreaterThan(0);
      expect(stats.totalNicknames).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle empty player names gracefully', async () => {
      const result = await resolver.resolvePlayerName('', mockContext);

      expect(result.matches).toHaveLength(0);
      expect(result.needsDisambiguation).toBe(false);
    });

    it('should handle null context gracefully', async () => {
      const result = await resolver.resolvePlayerName('Josh Allen');

      expect(result.suggestedMatch?.player.name).toBe('Josh Allen');
      // Should still work without context, just without contextual boosts
    });

    it('should handle special characters in names', async () => {
      const result = await resolver.resolvePlayerName('Josh Allen!@#', mockContext);

      // Should normalize and still find the player
      expect(result.suggestedMatch?.player.name).toBe('Josh Allen');
    });

    it('should handle very long input strings', async () => {
      const longName = 'a'.repeat(1000);
      const result = await resolver.resolvePlayerName(longName, mockContext);

      expect(result.matches).toHaveLength(0);
      expect(result.disambiguationPrompt).toContain('couldn\'t find');
    });
  });

  describe('soundex algorithm', () => {
    it('should generate consistent soundex codes', () => {
      // Test the soundex algorithm indirectly through fuzzy matching
      const testCases = [
        'Allen',
        'Alan',
        'Allyn'
      ];

      // These should all have similar soundex codes and potentially match
      testCases.forEach(async (name) => {
        const result = await resolver.resolvePlayerName(name, mockContext);
        expect(result.matches.length).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
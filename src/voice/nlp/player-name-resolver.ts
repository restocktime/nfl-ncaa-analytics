import { Player } from '../../models/Player';
import { ConversationContext } from '../types/voice.types';
import { logger } from '../../core/logger';

export interface PlayerMatch {
  player: Player;
  confidence: number;
  matchType: 'exact' | 'partial' | 'fuzzy' | 'nickname';
}

export interface DisambiguationResult {
  matches: PlayerMatch[];
  needsDisambiguation: boolean;
  suggestedMatch?: PlayerMatch;
  disambiguationPrompt?: string;
}

/**
 * Handles player name resolution and disambiguation for voice interactions
 */
export class PlayerNameResolver {
  private playerDatabase: Map<string, Player> = new Map();
  private nicknameMap: Map<string, string> = new Map();
  private soundexCache: Map<string, string> = new Map();

  constructor() {
    this.initializePlayerDatabase();
    this.initializeNicknameMap();
  }

  /**
   * Resolve player names with disambiguation
   */
  async resolvePlayerNames(
    playerNames: string[], 
    context?: ConversationContext
  ): Promise<DisambiguationResult[]> {
    const results: DisambiguationResult[] = [];

    for (const name of playerNames) {
      const result = await this.resolvePlayerName(name, context);
      results.push(result);
    }

    return results;
  }

  /**
   * Resolve a single player name
   */
  async resolvePlayerName(
    playerName: string, 
    context?: ConversationContext
  ): Promise<DisambiguationResult> {
    try {
      const normalizedName = this.normalizeName(playerName);
      const matches: PlayerMatch[] = [];

      // 1. Exact name match
      const exactMatch = this.findExactMatch(normalizedName);
      if (exactMatch) {
        matches.push({
          player: exactMatch,
          confidence: 1.0,
          matchType: 'exact'
        });
      }

      // 2. Nickname match
      const nicknameMatch = this.findNicknameMatch(normalizedName);
      if (nicknameMatch) {
        matches.push({
          player: nicknameMatch,
          confidence: 0.95,
          matchType: 'nickname'
        });
      }

      // 3. Partial name match (last name, first name)
      const partialMatches = this.findPartialMatches(normalizedName);
      matches.push(...partialMatches);

      // 4. Fuzzy match using Soundex
      if (matches.length === 0) {
        const fuzzyMatches = this.findFuzzyMatches(normalizedName);
        matches.push(...fuzzyMatches);
      }

      // Sort matches by confidence
      matches.sort((a, b) => b.confidence - a.confidence);

      // Apply context-based disambiguation
      const contextuallyRanked = this.applyContextualRanking(matches, context);

      return this.createDisambiguationResult(contextuallyRanked, playerName);
    } catch (error) {
      logger.error('Error resolving player name:', error);
      return {
        matches: [],
        needsDisambiguation: false
      };
    }
  }

  /**
   * Find exact name matches
   */
  private findExactMatch(normalizedName: string): Player | null {
    return this.playerDatabase.get(normalizedName) || null;
  }

  /**
   * Find nickname matches
   */
  private findNicknameMatch(normalizedName: string): Player | null {
    const canonicalName = this.nicknameMap.get(normalizedName);
    if (canonicalName) {
      return this.playerDatabase.get(canonicalName) || null;
    }
    return null;
  }

  /**
   * Find partial name matches
   */
  private findPartialMatches(normalizedName: string): PlayerMatch[] {
    const matches: PlayerMatch[] = [];
    const nameParts = normalizedName.split(' ');

    for (const [fullName, player] of this.playerDatabase) {
      const fullNameParts = fullName.split(' ');
      
      // Last name match
      if (nameParts.length === 1) {
        if (fullNameParts[fullNameParts.length - 1] === nameParts[0]) {
          matches.push({
            player,
            confidence: 0.8,
            matchType: 'partial'
          });
        }
      }
      
      // First + Last name match
      if (nameParts.length === 2 && fullNameParts.length >= 2) {
        if (fullNameParts[0] === nameParts[0] && 
            fullNameParts[fullNameParts.length - 1] === nameParts[1]) {
          matches.push({
            player,
            confidence: 0.9,
            matchType: 'partial'
          });
        }
      }

      // Partial substring match
      if (fullName.includes(normalizedName) || normalizedName.includes(fullName)) {
        matches.push({
          player,
          confidence: 0.7,
          matchType: 'partial'
        });
      }
    }

    return matches;
  }

  /**
   * Find fuzzy matches using Soundex algorithm
   */
  private findFuzzyMatches(normalizedName: string): PlayerMatch[] {
    const matches: PlayerMatch[] = [];
    const targetSoundex = this.getSoundex(normalizedName);

    for (const [fullName, player] of this.playerDatabase) {
      const playerSoundex = this.getSoundex(fullName);
      
      if (targetSoundex === playerSoundex) {
        matches.push({
          player,
          confidence: 0.6,
          matchType: 'fuzzy'
        });
      }
    }

    return matches;
  }

  /**
   * Apply contextual ranking to matches
   */
  private applyContextualRanking(
    matches: PlayerMatch[], 
    context?: ConversationContext
  ): PlayerMatch[] {
    if (!context) return matches;

    return matches.map(match => {
      let confidence = match.confidence;

      // Boost confidence for players on user's team
      if (context.userTeam?.includes(match.player.name)) {
        confidence += 0.15;
      }

      // Boost confidence for recently mentioned players
      if (context.recentPlayers?.includes(match.player.name)) {
        confidence += 0.1;
      }

      // Boost confidence for players in current league
      if (context.currentLeague && this.isPlayerInLeague(match.player, context.currentLeague)) {
        confidence += 0.05;
      }

      // Boost confidence for active players
      if (match.player.isActive) {
        confidence += 0.05;
      }

      return {
        ...match,
        confidence: Math.min(confidence, 1.0)
      };
    }).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Create disambiguation result
   */
  private createDisambiguationResult(
    matches: PlayerMatch[], 
    originalName: string
  ): DisambiguationResult {
    if (matches.length === 0) {
      return {
        matches: [],
        needsDisambiguation: false,
        disambiguationPrompt: `I couldn't find a player named "${originalName}". Could you try a different name?`
      };
    }

    if (matches.length === 1 || matches[0].confidence > 0.9) {
      return {
        matches,
        needsDisambiguation: false,
        suggestedMatch: matches[0]
      };
    }

    // Multiple matches with similar confidence - need disambiguation
    const topMatches = matches.slice(0, 3); // Show top 3 matches
    const playerNames = topMatches.map(m => m.player.name).join(', ');
    
    return {
      matches: topMatches,
      needsDisambiguation: true,
      disambiguationPrompt: `I found multiple players: ${playerNames}. Which one did you mean?`
    };
  }

  /**
   * Normalize player name for matching
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate Soundex code for fuzzy matching
   */
  private getSoundex(name: string): string {
    if (this.soundexCache.has(name)) {
      return this.soundexCache.get(name)!;
    }

    const soundex = this.calculateSoundex(name);
    this.soundexCache.set(name, soundex);
    return soundex;
  }

  /**
   * Calculate Soundex algorithm
   */
  private calculateSoundex(name: string): string {
    const normalized = name.toUpperCase().replace(/[^A-Z]/g, '');
    if (normalized.length === 0) return '0000';

    let soundex = normalized[0];
    const mapping: { [key: string]: string } = {
      'BFPV': '1',
      'CGJKQSXZ': '2',
      'DT': '3',
      'L': '4',
      'MN': '5',
      'R': '6'
    };

    for (let i = 1; i < normalized.length; i++) {
      const char = normalized[i];
      let code = '0';

      for (const [chars, digit] of Object.entries(mapping)) {
        if (chars.includes(char)) {
          code = digit;
          break;
        }
      }

      if (code !== '0' && code !== soundex[soundex.length - 1]) {
        soundex += code;
      }

      if (soundex.length === 4) break;
    }

    return soundex.padEnd(4, '0');
  }

  /**
   * Check if player is in a specific league (mock implementation)
   */
  private isPlayerInLeague(player: Player, leagueId: string): boolean {
    // This would check against actual league rosters
    return true; // Mock implementation
  }

  /**
   * Initialize player database (mock data)
   */
  private initializePlayerDatabase(): void {
    // Mock player data - in production this would come from a real database
    const mockPlayers: Player[] = [
      { id: '1', name: 'Josh Allen', position: 'QB', team: 'BUF', isActive: true },
      { id: '2', name: 'Patrick Mahomes', position: 'QB', team: 'KC', isActive: true },
      { id: '3', name: 'Christian McCaffrey', position: 'RB', team: 'SF', isActive: true },
      { id: '4', name: 'Cooper Kupp', position: 'WR', team: 'LAR', isActive: true },
      { id: '5', name: 'Davante Adams', position: 'WR', team: 'LV', isActive: true },
      { id: '6', name: 'Travis Kelce', position: 'TE', team: 'KC', isActive: true },
      { id: '7', name: 'Derrick Henry', position: 'RB', team: 'TEN', isActive: true },
      { id: '8', name: 'Tyreek Hill', position: 'WR', team: 'MIA', isActive: true },
      { id: '9', name: 'Aaron Rodgers', position: 'QB', team: 'NYJ', isActive: true },
      { id: '10', name: 'Stefon Diggs', position: 'WR', team: 'BUF', isActive: true }
    ];

    for (const player of mockPlayers) {
      this.playerDatabase.set(this.normalizeName(player.name), player);
    }
  }

  /**
   * Initialize nickname mappings
   */
  private initializeNicknameMap(): void {
    const nicknames: { [key: string]: string } = {
      'cmc': 'christian mccaffrey',
      'cmac': 'christian mccaffrey',
      'pat mahomes': 'patrick mahomes',
      'mahomes': 'patrick mahomes',
      'josh allen': 'josh allen',
      'allen': 'josh allen',
      'kupp': 'cooper kupp',
      'adams': 'davante adams',
      'devante adams': 'davante adams',
      'kelce': 'travis kelce',
      'henry': 'derrick henry',
      'king henry': 'derrick henry',
      'tyreek': 'tyreek hill',
      'cheetah': 'tyreek hill',
      'a-rod': 'aaron rodgers',
      'rodgers': 'aaron rodgers',
      'diggs': 'stefon diggs'
    };

    for (const [nickname, canonicalName] of Object.entries(nicknames)) {
      this.nicknameMap.set(nickname, this.normalizeName(canonicalName));
    }
  }

  /**
   * Add new player to database
   */
  addPlayer(player: Player): void {
    this.playerDatabase.set(this.normalizeName(player.name), player);
  }

  /**
   * Add nickname mapping
   */
  addNickname(nickname: string, canonicalName: string): void {
    this.nicknameMap.set(this.normalizeName(nickname), this.normalizeName(canonicalName));
  }

  /**
   * Get player database statistics
   */
  getStats(): { totalPlayers: number; totalNicknames: number } {
    return {
      totalPlayers: this.playerDatabase.size,
      totalNicknames: this.nicknameMap.size
    };
  }
}
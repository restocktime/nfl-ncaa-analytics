import { VoiceInput, ParsedIntent, EntityMap, Intent, ConversationContext, ResolvedEntities } from '../types/voice.types';
import { Player } from '../../models/Player';
import { logger } from '../../core/logger';

/**
 * Natural Language Processing Engine for Voice Assistant
 * Handles intent classification, entity extraction, and player name resolution
 */
export class NLPEngine {
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private entityPatterns: Map<string, RegExp> = new Map();
  private playerNameVariations: Map<string, string[]> = new Map();

  constructor() {
    this.initializeIntentPatterns();
    this.initializeEntityPatterns();
    this.initializePlayerNameVariations();
  }

  /**
   * Process voice input and extract intent and entities
   */
  async processVoiceInput(input: VoiceInput): Promise<ParsedIntent> {
    try {
      const normalizedText = this.normalizeText(input.text);
      
      // Extract entities first
      const entities = await this.extractEntities(normalizedText);
      
      // Classify intent with context
      const intent = await this.classifyIntent(normalizedText, input.context);
      
      // Resolve any ambiguous entities
      const resolvedEntities = await this.resolveAmbiguity(entities, input.context);

      return {
        intent,
        entities: resolvedEntities,
        confidence: intent.confidence,
        originalText: input.text,
        normalizedText,
        requiresConfirmation: this.requiresConfirmation(intent, resolvedEntities),
        multiStep: this.isMultiStep(intent)
      };
    } catch (error) {
      logger.error('Error processing voice input:', error);
      throw new Error('Failed to process voice input');
    }
  }

  /**
   * Extract entities from text (players, positions, weeks, teams)
   */
  async extractEntities(text: string): Promise<EntityMap> {
    const entities: EntityMap = {};

    // Extract player names
    const playerMatches = this.extractPlayerNames(text);
    if (playerMatches.length > 0) {
      entities.players = playerMatches;
    }

    // Extract positions
    const positionMatch = text.match(this.entityPatterns.get('position')!);
    if (positionMatch) {
      entities.position = this.normalizePosition(positionMatch[1] || positionMatch[0]);
    }

    // Extract week numbers
    const weekMatch = text.match(this.entityPatterns.get('week')!);
    if (weekMatch) {
      entities.week = parseInt(weekMatch[1] || weekMatch[2], 10);
    }

    // Extract team names
    const teamMatch = text.match(this.entityPatterns.get('team')!);
    if (teamMatch) {
      entities.team = this.normalizeTeamName(teamMatch[1] || teamMatch[0]);
    }

    // Extract numbers/points
    const numberMatch = text.match(this.entityPatterns.get('number')!);
    if (numberMatch) {
      entities.number = parseFloat(numberMatch[1] || numberMatch[0]);
    }

    return entities;
  }

  /**
   * Classify intent based on text and context
   */
  async classifyIntent(text: string, context?: ConversationContext): Promise<Intent> {
    const normalizedText = text.toLowerCase();
    let bestMatch: { name: string; confidence: number } = { name: 'unknown', confidence: 0 };

    // Check each intent pattern
    for (const [intentName, patterns] of this.intentPatterns) {
      for (const pattern of patterns) {
        const match = normalizedText.match(pattern);
        if (match) {
          const confidence = this.calculateConfidence(match, pattern, context);
          if (confidence > bestMatch.confidence) {
            bestMatch = { name: intentName, confidence };
          }
        }
      }
    }

    // Use context to boost confidence for related intents
    if (context && context.conversationTopic) {
      bestMatch.confidence = this.adjustConfidenceWithContext(bestMatch, context);
    }

    return {
      name: bestMatch.name,
      confidence: Math.min(bestMatch.confidence, 1.0),
      requiresConfirmation: bestMatch.confidence < 0.8,
      multiStep: this.isMultiStepIntent(bestMatch.name)
    };
  }

  /**
   * Resolve ambiguous entities using context
   */
  async resolveAmbiguity(entities: EntityMap, context?: ConversationContext): Promise<ResolvedEntities> {
    const resolved: ResolvedEntities = { ...entities };

    // Resolve ambiguous player names
    if (entities.players && entities.players.length > 0) {
      resolved.players = await this.resolvePlayerNames(entities.players, context);
    }

    // Resolve position ambiguity
    if (entities.position && this.isAmbiguousPosition(entities.position)) {
      resolved.position = this.resolvePositionAmbiguity(entities.position, context);
    }

    // Resolve week context
    if (!entities.week && context?.currentWeek) {
      resolved.week = context.currentWeek;
    }

    return resolved;
  }

  /**
   * Initialize intent recognition patterns
   */
  private initializeIntentPatterns(): void {
    this.intentPatterns.set('GetTeamStatus', [
      /how\s+is\s+my\s+team/i,
      /team\s+status/i,
      /how\s+am\s+i\s+doing/i,
      /my\s+team\s+performance/i,
      /team\s+summary/i
    ]);

    this.intentPatterns.set('GetPlayerProjection', [
      /how\s+many\s+points\s+will\s+(\w+(?:\s+\w+)*)/i,
      /(\w+(?:\s+\w+)*)\s+projection/i,
      /what\s+about\s+(\w+(?:\s+\w+)*)/i,
      /tell\s+me\s+about\s+(\w+(?:\s+\w+)*)/i
    ]);

    this.intentPatterns.set('SetLineup', [
      /start\s+(\w+(?:\s+\w+)*)/i,
      /bench\s+(\w+(?:\s+\w+)*)/i,
      /sit\s+(\w+(?:\s+\w+)*)/i,
      /play\s+(\w+(?:\s+\w+)*)/i,
      /lineup\s+change/i
    ]);

    this.intentPatterns.set('GetWaiverTargets', [
      /who\s+should\s+i\s+pick\s+up/i,
      /waiver\s+targets/i,
      /available\s+players/i,
      /pickup\s+recommendations/i,
      /free\s+agents/i
    ]);

    this.intentPatterns.set('AnalyzeTrade', [
      /should\s+i\s+trade/i,
      /trade\s+analysis/i,
      /trade\s+(\w+(?:\s+\w+)*)\s+for\s+(\w+(?:\s+\w+)*)/i,
      /accept\s+this\s+trade/i,
      /trade\s+value/i
    ]);

    this.intentPatterns.set('GetMatchupAnalysis', [
      /matchup\s+analysis/i,
      /this\s+week.+matchup/i,
      /opponent\s+analysis/i,
      /who\s+am\s+i\s+playing/i
    ]);
  }

  /**
   * Initialize entity extraction patterns
   */
  private initializeEntityPatterns(): void {
    this.entityPatterns.set('position', 
      /\b(?:at\s+)?(quarterback|qb|running\s+back|rb|wide\s+receiver|wr|tight\s+end|te|kicker|k|defense|dst|def)\b/i
    );
    
    this.entityPatterns.set('week', 
      /\b(?:week\s+)?(\d{1,2})|this\s+week|next\s+week\b/i
    );
    
    this.entityPatterns.set('team', 
      /\b(patriots|bills|dolphins|jets|steelers|ravens|browns|bengals|titans|colts|texans|jaguars|chiefs|raiders|chargers|broncos|cowboys|giants|eagles|commanders|packers|bears|lions|vikings|falcons|panthers|saints|buccaneers|cardinals|rams|49ers|seahawks)\b/i
    );
    
    this.entityPatterns.set('number', 
      /\b(\d+(?:\.\d+)?)\s*(?:points?|pts?)?\b/i
    );
  }

  /**
   * Initialize common player name variations
   */
  private initializePlayerNameVariations(): void {
    // Common nickname mappings
    this.playerNameVariations.set('josh allen', ['josh allen', 'allen']);
    this.playerNameVariations.set('patrick mahomes', ['patrick mahomes', 'mahomes', 'pat mahomes']);
    this.playerNameVariations.set('christian mccaffrey', ['christian mccaffrey', 'mccaffrey', 'cmc', 'christian mc caffrey']);
    this.playerNameVariations.set('cooper kupp', ['cooper kupp', 'kupp']);
    this.playerNameVariations.set('davante adams', ['davante adams', 'adams', 'devante adams']);
    // Add more common variations as needed
  }

  /**
   * Extract player names from text with fuzzy matching
   */
  private extractPlayerNames(text: string): string[] {
    const players: string[] = [];
    const normalizedText = text.toLowerCase();

    // Look for player name patterns
    const namePatterns = [
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g, // First Last
      /\b([A-Z][a-z]+)\b/g // Single name (could be last name)
    ];

    for (const pattern of namePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const playerName = match[1].toLowerCase();
        
        // Check if it matches known player variations
        for (const [canonicalName, variations] of this.playerNameVariations) {
          if (variations.some(variation => 
            variation.includes(playerName) || playerName.includes(variation)
          )) {
            players.push(canonicalName);
            break;
          }
        }
      }
    }

    return [...new Set(players)]; // Remove duplicates
  }

  /**
   * Resolve player names with disambiguation
   */
  private async resolvePlayerNames(playerNames: string[], context?: ConversationContext): Promise<string[]> {
    const resolved: string[] = [];

    for (const name of playerNames) {
      // Check for exact matches first
      if (this.playerNameVariations.has(name)) {
        resolved.push(name);
        continue;
      }

      // Look for partial matches
      const partialMatches: string[] = [];
      for (const [canonicalName, variations] of this.playerNameVariations) {
        if (variations.some(variation => 
          variation.includes(name) || name.includes(variation)
        )) {
          partialMatches.push(canonicalName);
        }
      }

      if (partialMatches.length === 1) {
        resolved.push(partialMatches[0]);
      } else if (partialMatches.length > 1) {
        // Use context to disambiguate
        const contextualMatch = this.disambiguateWithContext(partialMatches, context);
        resolved.push(contextualMatch || partialMatches[0]);
      } else {
        // Keep original name for further processing
        resolved.push(name);
      }
    }

    return resolved;
  }

  /**
   * Normalize text for processing
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize position names
   */
  private normalizePosition(position: string): string {
    const positionMap: { [key: string]: string } = {
      'qb': 'quarterback',
      'rb': 'running back',
      'wr': 'wide receiver',
      'te': 'tight end',
      'k': 'kicker',
      'dst': 'defense',
      'def': 'defense'
    };

    const normalized = position.toLowerCase();
    return positionMap[normalized] || normalized;
  }

  /**
   * Normalize team names
   */
  private normalizeTeamName(team: string): string {
    // Convert common team name variations to standard names
    const teamMap: { [key: string]: string } = {
      'pats': 'patriots',
      'niners': '49ers',
      'hawks': 'seahawks'
    };

    const normalized = team.toLowerCase();
    return teamMap[normalized] || normalized;
  }

  /**
   * Calculate confidence score for intent match
   */
  private calculateConfidence(match: RegExpMatchArray, pattern: RegExp, context?: ConversationContext): number {
    let confidence = 0.7; // Base confidence

    // Boost confidence for exact pattern matches
    if (match[0].length > 10) confidence += 0.1;
    
    // Boost confidence if context supports the intent
    if (context?.conversationTopic) {
      confidence += 0.1;
    }

    // Boost confidence for captured groups (specific entities)
    if (match.length > 1) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Adjust confidence based on conversation context
   */
  private adjustConfidenceWithContext(match: { name: string; confidence: number }, context: ConversationContext): number {
    if (!context.conversationTopic) return match.confidence;

    // Boost confidence for related intents
    const relatedIntents: { [key: string]: string[] } = {
      'lineup': ['SetLineup', 'GetPlayerProjection'],
      'waiver': ['GetWaiverTargets', 'GetPlayerProjection'],
      'trade': ['AnalyzeTrade', 'GetPlayerProjection']
    };

    for (const [topic, intents] of Object.entries(relatedIntents)) {
      if (context.conversationTopic === topic && intents.includes(match.name)) {
        return Math.min(match.confidence + 0.15, 1.0);
      }
    }

    return match.confidence;
  }

  /**
   * Check if intent requires confirmation
   */
  private requiresConfirmation(intent: Intent, entities: ResolvedEntities): boolean {
    const confirmationIntents = ['SetLineup', 'AnalyzeTrade'];
    return confirmationIntents.includes(intent.name) || intent.confidence < 0.8;
  }

  /**
   * Check if intent is multi-step
   */
  private isMultiStep(intent: Intent): boolean {
    return this.isMultiStepIntent(intent.name);
  }

  /**
   * Check if intent name is multi-step
   */
  private isMultiStepIntent(intentName: string): boolean {
    const multiStepIntents = ['SetLineup', 'AnalyzeTrade', 'GetWaiverTargets'];
    return multiStepIntents.includes(intentName);
  }

  /**
   * Check if position is ambiguous
   */
  private isAmbiguousPosition(position: string): boolean {
    const ambiguousPositions = ['back', 'end', 'receiver'];
    return ambiguousPositions.some(ambiguous => position.includes(ambiguous));
  }

  /**
   * Resolve position ambiguity using context
   */
  private resolvePositionAmbiguity(position: string, context?: ConversationContext): string {
    if (position.includes('back')) {
      return context?.lastPosition === 'quarterback' ? 'quarterback' : 'running back';
    }
    if (position.includes('end')) {
      return 'tight end';
    }
    if (position.includes('receiver')) {
      return 'wide receiver';
    }
    return position;
  }

  /**
   * Disambiguate player names using context
   */
  private disambiguateWithContext(matches: string[], context?: ConversationContext): string | null {
    if (!context?.userTeam) return null;

    // Prefer players on user's team
    for (const match of matches) {
      if (context.userTeam.includes(match)) {
        return match;
      }
    }

    // Prefer players mentioned recently
    if (context.recentPlayers) {
      for (const match of matches) {
        if (context.recentPlayers.includes(match)) {
          return match;
        }
      }
    }

    return null;
  }
}
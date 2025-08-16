import { ConversationContext, ContextUpdate, ConversationFlow, VoiceIntent } from '../types/voice.types';
import { Player } from '../../models/Player';
import { logger } from '../../core/logger';

/**
 * Manages conversation context and state across voice interactions
 */
export class ConversationContextManager {
  private contexts: Map<string, ConversationContext> = new Map();
  private contextTimeout = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Clean up expired contexts every 5 minutes
    setInterval(() => this.cleanupExpiredContexts(), 5 * 60 * 1000);
  }

  /**
   * Get conversation context for a session
   */
  async getConversationContext(sessionId: string): Promise<ConversationContext> {
    const context = this.contexts.get(sessionId);
    
    if (!context) {
      // Create new context
      const newContext: ConversationContext = {
        sessionId,
        userId: '',
        currentLeague: '',
        conversationTopic: null,
        pendingActions: [],
        entityContext: {},
        lastInteraction: new Date(),
        currentWeek: this.getCurrentNFLWeek(),
        userTeam: [],
        recentPlayers: [],
        lastPosition: null,
        conversationHistory: []
      };
      
      this.contexts.set(sessionId, newContext);
      return newContext;
    }

    // Update last interaction time
    context.lastInteraction = new Date();
    return context;
  }

  /**
   * Update conversation context
   */
  async updateContext(sessionId: string, update: ContextUpdate): Promise<void> {
    try {
      const context = await this.getConversationContext(sessionId);
      
      // Apply updates
      if (update.userId !== undefined) context.userId = update.userId;
      if (update.currentLeague !== undefined) context.currentLeague = update.currentLeague;
      if (update.conversationTopic !== undefined) context.conversationTopic = update.conversationTopic;
      if (update.pendingActions !== undefined) context.pendingActions = update.pendingActions;
      if (update.entityContext !== undefined) {
        context.entityContext = { ...context.entityContext, ...update.entityContext };
      }
      if (update.currentWeek !== undefined) context.currentWeek = update.currentWeek;
      if (update.userTeam !== undefined) context.userTeam = update.userTeam;
      if (update.recentPlayers !== undefined) {
        // Add to recent players, keep only last 10
        context.recentPlayers = [...new Set([...update.recentPlayers, ...context.recentPlayers])].slice(0, 10);
      }
      if (update.lastPosition !== undefined) context.lastPosition = update.lastPosition;
      if (update.conversationHistory !== undefined) {
        context.conversationHistory.push(...update.conversationHistory);
        // Keep only last 20 interactions
        context.conversationHistory = context.conversationHistory.slice(-20);
      }

      context.lastInteraction = new Date();
      this.contexts.set(sessionId, context);
      
      logger.debug(`Updated context for session ${sessionId}`, { update });
    } catch (error) {
      logger.error('Error updating conversation context:', error);
      throw new Error('Failed to update conversation context');
    }
  }

  /**
   * Resolve player reference using context
   */
  async resolvePlayerReference(playerRef: string, context: ConversationContext): Promise<Player | null> {
    try {
      const normalizedRef = playerRef.toLowerCase().trim();

      // Check if it's a pronoun reference
      if (this.isPronounReference(normalizedRef)) {
        return this.resolvePronounReference(normalizedRef, context);
      }

      // Check recent players first
      for (const recentPlayer of context.recentPlayers) {
        if (this.matchesPlayerName(normalizedRef, recentPlayer)) {
          return this.getPlayerByName(recentPlayer);
        }
      }

      // Check user's team
      for (const teamPlayer of context.userTeam) {
        if (this.matchesPlayerName(normalizedRef, teamPlayer)) {
          return this.getPlayerByName(teamPlayer);
        }
      }

      // Fallback to general player search
      return this.searchPlayerByName(normalizedRef);
    } catch (error) {
      logger.error('Error resolving player reference:', error);
      return null;
    }
  }

  /**
   * Maintain conversation flow based on intent and context
   */
  async maintainConversationFlow(intent: VoiceIntent, context: ConversationContext): Promise<ConversationFlow> {
    try {
      const flow: ConversationFlow = {
        currentStep: 1,
        totalSteps: 1,
        nextAction: 'complete',
        requiresInput: false,
        contextUpdates: {},
        followUpSuggestions: []
      };

      // Determine conversation flow based on intent
      switch (intent.name) {
        case 'SetLineup':
          return this.handleLineupFlow(intent, context);
        
        case 'AnalyzeTrade':
          return this.handleTradeFlow(intent, context);
        
        case 'GetWaiverTargets':
          return this.handleWaiverFlow(intent, context);
        
        case 'GetPlayerProjection':
          return this.handleProjectionFlow(intent, context);
        
        default:
          return flow;
      }
    } catch (error) {
      logger.error('Error maintaining conversation flow:', error);
      throw new Error('Failed to maintain conversation flow');
    }
  }

  /**
   * Handle lineup change conversation flow
   */
  private handleLineupFlow(intent: VoiceIntent, context: ConversationContext): ConversationFlow {
    const flow: ConversationFlow = {
      currentStep: 1,
      totalSteps: 3,
      nextAction: 'confirm',
      requiresInput: true,
      contextUpdates: {
        conversationTopic: 'lineup',
        pendingActions: [{
          type: 'lineup_change',
          data: intent.entities,
          timestamp: new Date(),
          requiresConfirmation: true
        }]
      },
      followUpSuggestions: [
        'Yes, make that change',
        'No, cancel that',
        'Tell me more about this player'
      ]
    };

    // Check if we have all required information
    if (!intent.entities.players || !intent.entities.position) {
      flow.nextAction = 'clarify';
      flow.requiresInput = true;
      flow.followUpSuggestions = [
        'Which player?',
        'What position?'
      ];
    }

    return flow;
  }

  /**
   * Handle trade analysis conversation flow
   */
  private handleTradeFlow(intent: VoiceIntent, context: ConversationContext): ConversationFlow {
    const flow: ConversationFlow = {
      currentStep: 1,
      totalSteps: 2,
      nextAction: 'analyze',
      requiresInput: false,
      contextUpdates: {
        conversationTopic: 'trade'
      },
      followUpSuggestions: [
        'Tell me more about this trade',
        'What about other options?',
        'Should I counter offer?'
      ]
    };

    return flow;
  }

  /**
   * Handle waiver wire conversation flow
   */
  private handleWaiverFlow(intent: VoiceIntent, context: ConversationContext): ConversationFlow {
    const flow: ConversationFlow = {
      currentStep: 1,
      totalSteps: 2,
      nextAction: 'recommend',
      requiresInput: false,
      contextUpdates: {
        conversationTopic: 'waiver'
      },
      followUpSuggestions: [
        'Tell me more about this player',
        'Who else is available?',
        'Add to my watchlist'
      ]
    };

    return flow;
  }

  /**
   * Handle player projection conversation flow
   */
  private handleProjectionFlow(intent: VoiceIntent, context: ConversationContext): ConversationFlow {
    const flow: ConversationFlow = {
      currentStep: 1,
      totalSteps: 1,
      nextAction: 'complete',
      requiresInput: false,
      contextUpdates: {
        recentPlayers: intent.entities.players || []
      },
      followUpSuggestions: [
        'What about other players?',
        'Should I start this player?',
        'Tell me about the matchup'
      ]
    };

    return flow;
  }

  /**
   * Check if reference is a pronoun
   */
  private isPronounReference(ref: string): boolean {
    const pronouns = ['he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'this player', 'that player'];
    return pronouns.includes(ref);
  }

  /**
   * Resolve pronoun reference to actual player
   */
  private resolvePronounReference(pronoun: string, context: ConversationContext): Player | null {
    // Get the most recently mentioned player
    if (context.recentPlayers.length > 0) {
      return this.getPlayerByName(context.recentPlayers[0]);
    }
    return null;
  }

  /**
   * Check if a reference matches a player name
   */
  private matchesPlayerName(ref: string, playerName: string): boolean {
    const refWords = ref.split(' ');
    const nameWords = playerName.toLowerCase().split(' ');
    
    // Check for exact match
    if (ref === playerName.toLowerCase()) return true;
    
    // Check for partial match (last name)
    if (refWords.length === 1 && nameWords.includes(refWords[0])) return true;
    
    // Check for first + last name match
    if (refWords.length === 2 && nameWords.length >= 2) {
      return refWords[0] === nameWords[0] && refWords[1] === nameWords[nameWords.length - 1];
    }
    
    return false;
  }

  /**
   * Get player by name (mock implementation)
   */
  private getPlayerByName(name: string): Player | null {
    // This would integrate with the actual player database
    // For now, return a mock player
    return {
      id: name.replace(' ', '_'),
      name,
      position: 'QB', // Would be actual position
      team: 'NFL', // Would be actual team
      isActive: true
    } as Player;
  }

  /**
   * Search for player by name (mock implementation)
   */
  private searchPlayerByName(name: string): Player | null {
    // This would perform fuzzy search in the player database
    return this.getPlayerByName(name);
  }

  /**
   * Get current NFL week
   */
  private getCurrentNFLWeek(): number {
    // Simple calculation - would be more sophisticated in production
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
    const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(18, weeksSinceStart + 1));
  }

  /**
   * Clean up expired contexts
   */
  private cleanupExpiredContexts(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, context] of this.contexts) {
      if (now.getTime() - context.lastInteraction.getTime() > this.contextTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.contexts.delete(sessionId);
      logger.debug(`Cleaned up expired context for session ${sessionId}`);
    }
  }

  /**
   * Clear context for a session
   */
  async clearContext(sessionId: string): Promise<void> {
    this.contexts.delete(sessionId);
    logger.debug(`Cleared context for session ${sessionId}`);
  }

  /**
   * Get context statistics
   */
  getContextStats(): { activeContexts: number; oldestContext: Date | null } {
    const contexts = Array.from(this.contexts.values());
    return {
      activeContexts: contexts.length,
      oldestContext: contexts.length > 0 
        ? new Date(Math.min(...contexts.map(c => c.lastInteraction.getTime())))
        : null
    };
  }
}
import { 
  ConversationContext, 
  ConversationTopic, 
  EntityContext, 
  PendingAction,
  Intent,
  VoiceIntentType
} from '../types/voice.types';

/**
 * Context manager for maintaining conversation state and user context
 */
export class ContextManagerService {
  private contexts: Map<string, ConversationContext> = new Map();

  /**
   * Get conversation context for a session
   */
  async getConversationContext(sessionId: string): Promise<ConversationContext | null> {
    return this.contexts.get(sessionId) || null;
  }

  /**
   * Create new conversation context
   */
  async createConversationContext(sessionId: string, userId: string): Promise<ConversationContext> {
    const context: ConversationContext = {
      sessionId,
      userId,
      pendingActions: [],
      entityContext: {
        recentPlayers: [],
        currentWeek: this.getCurrentWeek(),
        activeLeague: undefined,
        lastMentionedTeam: undefined
      },
      lastInteraction: new Date(),
      turnCount: 0
    };

    this.contexts.set(sessionId, context);
    return context;
  }

  /**
   * Update conversation context
   */
  async updateContext(sessionId: string, updates: Partial<ConversationContext>): Promise<void> {
    const context = this.contexts.get(sessionId);
    if (context) {
      Object.assign(context, updates);
      context.lastInteraction = new Date();
      context.turnCount += 1;
    }
  }

  /**
   * Resolve player reference using conversation context
   */
  async resolvePlayerReference(playerRef: string, context: ConversationContext): Promise<string | null> {
    // TODO: Implement player reference resolution
    // This should handle cases like "him", "that player", "the quarterback", etc.
    throw new Error('Not implemented');
  }

  /**
   * Maintain conversation flow based on intent and context
   */
  async maintainConversationFlow(intent: Intent, context: ConversationContext): Promise<ConversationTopic | null> {
    const topicMapping: Record<VoiceIntentType, ConversationTopic> = {
      [VoiceIntentType.GET_TEAM_STATUS]: ConversationTopic.TEAM_STATUS,
      [VoiceIntentType.GET_PLAYER_PROJECTION]: ConversationTopic.PLAYER_ANALYSIS,
      [VoiceIntentType.SET_LINEUP]: ConversationTopic.LINEUP_MANAGEMENT,
      [VoiceIntentType.GET_WAIVER_TARGETS]: ConversationTopic.WAIVER_WIRE,
      [VoiceIntentType.ANALYZE_TRADE]: ConversationTopic.TRADE_ANALYSIS,
      [VoiceIntentType.GET_MATCHUP_ANALYSIS]: ConversationTopic.TEAM_STATUS,
      [VoiceIntentType.HELP]: context.conversationTopic || ConversationTopic.TEAM_STATUS,
      [VoiceIntentType.CANCEL]: context.conversationTopic || ConversationTopic.TEAM_STATUS,
      [VoiceIntentType.STOP]: context.conversationTopic || ConversationTopic.TEAM_STATUS
    };

    return topicMapping[intent.name] || null;
  }

  /**
   * Add pending action to context
   */
  async addPendingAction(sessionId: string, action: PendingAction): Promise<void> {
    const context = this.contexts.get(sessionId);
    if (context) {
      context.pendingActions.push(action);
    }
  }

  /**
   * Remove pending action from context
   */
  async removePendingAction(sessionId: string, actionType: string): Promise<void> {
    const context = this.contexts.get(sessionId);
    if (context) {
      context.pendingActions = context.pendingActions.filter(
        action => action.actionType !== actionType
      );
    }
  }

  /**
   * Update entity context with new information
   */
  async updateEntityContext(sessionId: string, entityUpdates: Partial<EntityContext>): Promise<void> {
    const context = this.contexts.get(sessionId);
    if (context) {
      Object.assign(context.entityContext, entityUpdates);
    }
  }

  /**
   * Clean up expired contexts
   */
  async cleanupExpiredContexts(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, context] of this.contexts.entries()) {
      const timeSinceLastInteraction = now.getTime() - context.lastInteraction.getTime();
      const thirtyMinutes = 30 * 60 * 1000;

      if (timeSinceLastInteraction > thirtyMinutes) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.contexts.delete(sessionId);
    });
  }

  /**
   * Get current NFL week
   */
  private getCurrentWeek(): number {
    // TODO: Implement logic to determine current NFL week
    // This should integrate with the existing fantasy service
    return 1;
  }

  /**
   * Check if context has required information for intent
   */
  async hasRequiredContext(intent: Intent, context: ConversationContext): Promise<boolean> {
    switch (intent.name) {
      case VoiceIntentType.GET_TEAM_STATUS:
        return !!context.entityContext.activeLeague;
      case VoiceIntentType.SET_LINEUP:
        return !!context.entityContext.activeLeague;
      case VoiceIntentType.GET_WAIVER_TARGETS:
        return !!context.entityContext.activeLeague;
      case VoiceIntentType.ANALYZE_TRADE:
        return !!context.entityContext.activeLeague;
      default:
        return true;
    }
  }
}
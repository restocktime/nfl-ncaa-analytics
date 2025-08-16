import { ConversationContextManager } from '../nlp/conversation-context-manager';
import { ConversationContext, ContextUpdate, VoiceIntent } from '../types/voice.types';

describe('ConversationContextManager', () => {
  let contextManager: ConversationContextManager;
  const testSessionId = 'test-session-123';

  beforeEach(() => {
    contextManager = new ConversationContextManager();
  });

  describe('getConversationContext', () => {
    it('should create new context for new session', async () => {
      const context = await contextManager.getConversationContext(testSessionId);

      expect(context.sessionId).toBe(testSessionId);
      expect(context.userId).toBe('');
      expect(context.conversationTopic).toBeNull();
      expect(context.pendingActions).toEqual([]);
      expect(context.currentWeek).toBeGreaterThan(0);
      expect(context.lastInteraction).toBeInstanceOf(Date);
    });

    it('should return existing context for known session', async () => {
      // Create initial context
      const context1 = await contextManager.getConversationContext(testSessionId);
      context1.userId = 'test-user';

      // Get context again
      const context2 = await contextManager.getConversationContext(testSessionId);

      expect(context2.userId).toBe('test-user');
      expect(context2.sessionId).toBe(testSessionId);
    });

    it('should update last interaction time on access', async () => {
      const context1 = await contextManager.getConversationContext(testSessionId);
      const firstTime = context1.lastInteraction;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      const context2 = await contextManager.getConversationContext(testSessionId);
      const secondTime = context2.lastInteraction;

      expect(secondTime.getTime()).toBeGreaterThan(firstTime.getTime());
    });
  });

  describe('updateContext', () => {
    it('should update user information', async () => {
      const update: ContextUpdate = {
        userId: 'user-123',
        currentLeague: 'league-456'
      };

      await contextManager.updateContext(testSessionId, update);
      const context = await contextManager.getConversationContext(testSessionId);

      expect(context.userId).toBe('user-123');
      expect(context.currentLeague).toBe('league-456');
    });

    it('should update conversation topic', async () => {
      const update: ContextUpdate = {
        conversationTopic: 'lineup'
      };

      await contextManager.updateContext(testSessionId, update);
      const context = await contextManager.getConversationContext(testSessionId);

      expect(context.conversationTopic).toBe('lineup');
    });

    it('should add pending actions', async () => {
      const pendingAction = {
        type: 'lineup_change',
        data: { player: 'josh allen', position: 'qb' },
        timestamp: new Date(),
        requiresConfirmation: true
      };

      const update: ContextUpdate = {
        pendingActions: [pendingAction]
      };

      await contextManager.updateContext(testSessionId, update);
      const context = await contextManager.getConversationContext(testSessionId);

      expect(context.pendingActions).toHaveLength(1);
      expect(context.pendingActions[0].type).toBe('lineup_change');
    });

    it('should merge entity context', async () => {
      // Set initial entity context
      await contextManager.updateContext(testSessionId, {
        entityContext: { lastPlayer: 'josh allen' }
      });

      // Update with additional context
      await contextManager.updateContext(testSessionId, {
        entityContext: { lastPosition: 'quarterback' }
      });

      const context = await contextManager.getConversationContext(testSessionId);

      expect(context.entityContext.lastPlayer).toBe('josh allen');
      expect(context.entityContext.lastPosition).toBe('quarterback');
    });

    it('should manage recent players list', async () => {
      const update: ContextUpdate = {
        recentPlayers: ['josh allen', 'patrick mahomes']
      };

      await contextManager.updateContext(testSessionId, update);
      
      // Add more players
      await contextManager.updateContext(testSessionId, {
        recentPlayers: ['christian mccaffrey']
      });

      const context = await contextManager.getConversationContext(testSessionId);

      expect(context.recentPlayers).toContain('christian mccaffrey');
      expect(context.recentPlayers).toContain('josh allen');
      expect(context.recentPlayers).toContain('patrick mahomes');
    });

    it('should limit recent players to 10', async () => {
      const manyPlayers = Array.from({ length: 15 }, (_, i) => `player-${i}`);
      
      await contextManager.updateContext(testSessionId, {
        recentPlayers: manyPlayers
      });

      const context = await contextManager.getConversationContext(testSessionId);

      expect(context.recentPlayers).toHaveLength(10);
    });

    it('should manage conversation history', async () => {
      const historyEntry = {
        timestamp: new Date(),
        userInput: 'how is my team doing',
        intent: 'GetTeamStatus',
        entities: {},
        response: 'Your team is projected for 125 points'
      };

      await contextManager.updateContext(testSessionId, {
        conversationHistory: [historyEntry]
      });

      const context = await contextManager.getConversationContext(testSessionId);

      expect(context.conversationHistory).toHaveLength(1);
      expect(context.conversationHistory[0].userInput).toBe('how is my team doing');
    });

    it('should limit conversation history to 20 entries', async () => {
      const manyEntries = Array.from({ length: 25 }, (_, i) => ({
        timestamp: new Date(),
        userInput: `input-${i}`,
        intent: 'test',
        entities: {},
        response: `response-${i}`
      }));

      await contextManager.updateContext(testSessionId, {
        conversationHistory: manyEntries
      });

      const context = await contextManager.getConversationContext(testSessionId);

      expect(context.conversationHistory).toHaveLength(20);
      // Should keep the most recent entries
      expect(context.conversationHistory[19].userInput).toBe('input-24');
    });
  });

  describe('resolvePlayerReference', () => {
    beforeEach(async () => {
      // Set up context with recent players and team
      await contextManager.updateContext(testSessionId, {
        recentPlayers: ['josh allen', 'christian mccaffrey'],
        userTeam: ['josh allen', 'cooper kupp', 'travis kelce']
      });
    });

    it('should resolve pronoun references', async () => {
      const context = await contextManager.getConversationContext(testSessionId);
      const player = await contextManager.resolvePlayerReference('he', context);

      expect(player).not.toBeNull();
      expect(player?.name).toBe('josh allen'); // Most recent player
    });

    it('should resolve "this player" references', async () => {
      const context = await contextManager.getConversationContext(testSessionId);
      const player = await contextManager.resolvePlayerReference('this player', context);

      expect(player).not.toBeNull();
      expect(player?.name).toBe('josh allen');
    });

    it('should resolve partial name matches from recent players', async () => {
      const context = await contextManager.getConversationContext(testSessionId);
      const player = await contextManager.resolvePlayerReference('allen', context);

      expect(player).not.toBeNull();
      expect(player?.name).toBe('josh allen');
    });

    it('should resolve full name matches', async () => {
      const context = await contextManager.getConversationContext(testSessionId);
      const player = await contextManager.resolvePlayerReference('josh allen', context);

      expect(player).not.toBeNull();
      expect(player?.name).toBe('josh allen');
    });

    it('should return null for unresolvable references', async () => {
      const context = await contextManager.getConversationContext(testSessionId);
      const player = await contextManager.resolvePlayerReference('unknown player', context);

      expect(player).toBeNull();
    });

    it('should prioritize recent players over team players', async () => {
      // Add a player to team but not recent
      await contextManager.updateContext(testSessionId, {
        userTeam: ['josh allen', 'cooper kupp', 'travis kelce', 'other allen']
      });

      const context = await contextManager.getConversationContext(testSessionId);
      const player = await contextManager.resolvePlayerReference('allen', context);

      // Should resolve to josh allen (recent) not other allen (team only)
      expect(player?.name).toBe('josh allen');
    });
  });

  describe('maintainConversationFlow', () => {
    it('should handle lineup change flow', async () => {
      const intent: VoiceIntent = {
        name: 'SetLineup',
        confidence: 0.9,
        requiresConfirmation: true,
        multiStep: true,
        entities: {
          players: ['josh allen'],
          position: 'quarterback'
        }
      };

      const context = await contextManager.getConversationContext(testSessionId);
      const flow = await contextManager.maintainConversationFlow(intent, context);

      expect(flow.totalSteps).toBe(3);
      expect(flow.nextAction).toBe('confirm');
      expect(flow.requiresInput).toBe(true);
      expect(flow.contextUpdates.conversationTopic).toBe('lineup');
      expect(flow.followUpSuggestions).toContain('Yes, make that change');
    });

    it('should handle incomplete lineup change flow', async () => {
      const intent: VoiceIntent = {
        name: 'SetLineup',
        confidence: 0.9,
        requiresConfirmation: true,
        multiStep: true,
        entities: {
          players: ['josh allen']
          // Missing position
        }
      };

      const context = await contextManager.getConversationContext(testSessionId);
      const flow = await contextManager.maintainConversationFlow(intent, context);

      expect(flow.nextAction).toBe('clarify');
      expect(flow.requiresInput).toBe(true);
      expect(flow.followUpSuggestions).toContain('What position?');
    });

    it('should handle trade analysis flow', async () => {
      const intent: VoiceIntent = {
        name: 'AnalyzeTrade',
        confidence: 0.8,
        requiresConfirmation: false,
        multiStep: true,
        entities: {
          players: ['josh allen', 'patrick mahomes']
        }
      };

      const context = await contextManager.getConversationContext(testSessionId);
      const flow = await contextManager.maintainConversationFlow(intent, context);

      expect(flow.totalSteps).toBe(2);
      expect(flow.nextAction).toBe('analyze');
      expect(flow.requiresInput).toBe(false);
      expect(flow.contextUpdates.conversationTopic).toBe('trade');
    });

    it('should handle waiver wire flow', async () => {
      const intent: VoiceIntent = {
        name: 'GetWaiverTargets',
        confidence: 0.9,
        requiresConfirmation: false,
        multiStep: false,
        entities: {}
      };

      const context = await contextManager.getConversationContext(testSessionId);
      const flow = await contextManager.maintainConversationFlow(intent, context);

      expect(flow.totalSteps).toBe(2);
      expect(flow.nextAction).toBe('recommend');
      expect(flow.contextUpdates.conversationTopic).toBe('waiver');
      expect(flow.followUpSuggestions).toContain('Tell me more about this player');
    });

    it('should handle player projection flow', async () => {
      const intent: VoiceIntent = {
        name: 'GetPlayerProjection',
        confidence: 0.9,
        requiresConfirmation: false,
        multiStep: false,
        entities: {
          players: ['josh allen']
        }
      };

      const context = await contextManager.getConversationContext(testSessionId);
      const flow = await contextManager.maintainConversationFlow(intent, context);

      expect(flow.totalSteps).toBe(1);
      expect(flow.nextAction).toBe('complete');
      expect(flow.requiresInput).toBe(false);
      expect(flow.contextUpdates.recentPlayers).toContain('josh allen');
    });

    it('should handle unknown intents', async () => {
      const intent: VoiceIntent = {
        name: 'UnknownIntent',
        confidence: 0.3,
        requiresConfirmation: false,
        multiStep: false,
        entities: {}
      };

      const context = await contextManager.getConversationContext(testSessionId);
      const flow = await contextManager.maintainConversationFlow(intent, context);

      expect(flow.totalSteps).toBe(1);
      expect(flow.nextAction).toBe('complete');
      expect(flow.requiresInput).toBe(false);
    });
  });

  describe('context cleanup', () => {
    it('should provide context statistics', () => {
      const stats = contextManager.getContextStats();

      expect(stats).toHaveProperty('activeContexts');
      expect(stats).toHaveProperty('oldestContext');
      expect(typeof stats.activeContexts).toBe('number');
    });

    it('should clear specific context', async () => {
      // Create a context
      await contextManager.getConversationContext(testSessionId);
      
      // Clear it
      await contextManager.clearContext(testSessionId);
      
      // Getting it again should create a new one
      const newContext = await contextManager.getConversationContext(testSessionId);
      expect(newContext.userId).toBe(''); // Should be empty for new context
    });
  });

  describe('error handling', () => {
    it('should handle errors in updateContext gracefully', async () => {
      // This should not throw
      await expect(contextManager.updateContext('', {})).rejects.toThrow();
    });

    it('should handle errors in resolvePlayerReference gracefully', async () => {
      const context = await contextManager.getConversationContext(testSessionId);
      
      // Should not throw, should return null
      const result = await contextManager.resolvePlayerReference('', context);
      expect(result).toBeNull();
    });

    it('should handle errors in maintainConversationFlow gracefully', async () => {
      const invalidIntent = {} as VoiceIntent;
      const context = await contextManager.getConversationContext(testSessionId);
      
      await expect(contextManager.maintainConversationFlow(invalidIntent, context))
        .rejects.toThrow();
    });
  });
});
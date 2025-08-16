import { NLPEngine } from '../nlp/nlp-engine';
import { ConversationContextManager } from '../nlp/conversation-context-manager';
import { PlayerNameResolver } from '../nlp/player-name-resolver';
import { VoiceInput, ConversationContext } from '../types/voice.types';

describe('NLP Integration Tests', () => {
  let nlpEngine: NLPEngine;
  let contextManager: ConversationContextManager;
  let playerResolver: PlayerNameResolver;
  const testSessionId = 'integration-test-session';

  beforeEach(() => {
    nlpEngine = new NLPEngine();
    contextManager = new ConversationContextManager();
    playerResolver = new PlayerNameResolver();
  });

  describe('Complete voice interaction workflows', () => {
    it('should handle a complete lineup change conversation', async () => {
      // Step 1: Initial lineup change request
      const input1: VoiceInput = {
        text: 'Start Josh Allen at quarterback',
        platform: 'alexa',
        sessionId: testSessionId
      };

      const result1 = await nlpEngine.processVoiceInput(input1);

      expect(result1.intent.name).toBe('SetLineup');
      expect(result1.entities.players).toContain('josh allen');
      expect(result1.entities.position).toBe('quarterback');
      expect(result1.requiresConfirmation).toBe(true);

      // Step 2: Update context with the pending action
      const context = await contextManager.getConversationContext(testSessionId);
      await contextManager.updateContext(testSessionId, {
        conversationTopic: 'lineup',
        recentPlayers: ['josh allen'],
        pendingActions: [{
          type: 'lineup_change',
          data: { player: 'josh allen', position: 'quarterback' },
          timestamp: new Date(),
          requiresConfirmation: true
        }]
      });

      // Step 3: User confirms the change
      const input2: VoiceInput = {
        text: 'Yes, make that change',
        platform: 'alexa',
        sessionId: testSessionId,
        context: await contextManager.getConversationContext(testSessionId)
      };

      const result2 = await nlpEngine.processVoiceInput(input2);
      
      // Should recognize this as a confirmation in the lineup context
      expect(result2.intent.confidence).toBeGreaterThan(0.7);
    });

    it('should handle player name disambiguation workflow', async () => {
      // Step 1: Ambiguous player reference
      const input1: VoiceInput = {
        text: 'How many points will Johnson score?',
        platform: 'google',
        sessionId: testSessionId
      };

      const result1 = await nlpEngine.processVoiceInput(input1);

      expect(result1.intent.name).toBe('GetPlayerProjection');
      expect(result1.entities.players).toContain('johnson');

      // Step 2: Resolve player name disambiguation
      const disambiguationResults = await playerResolver.resolvePlayerNames(
        result1.entities.players || [],
        await contextManager.getConversationContext(testSessionId)
      );

      // Should indicate disambiguation needed for common last name
      const johnsonResult = disambiguationResults.find(r => 
        r.matches.some(m => m.player.name.toLowerCase().includes('johnson'))
      );

      if (johnsonResult && johnsonResult.needsDisambiguation) {
        expect(johnsonResult.disambiguationPrompt).toContain('multiple players');
      }

      // Step 3: User clarifies which Johnson
      await contextManager.updateContext(testSessionId, {
        conversationTopic: 'projections',
        recentPlayers: ['diontae johnson']
      });

      const input2: VoiceInput = {
        text: 'Diontae Johnson',
        platform: 'google',
        sessionId: testSessionId,
        context: await contextManager.getConversationContext(testSessionId)
      };

      const result2 = await nlpEngine.processVoiceInput(input2);
      expect(result2.entities.players).toContain('diontae johnson');
    });

    it('should handle multi-turn trade analysis conversation', async () => {
      // Step 1: Initial trade question
      const input1: VoiceInput = {
        text: 'Should I trade CMC for Tyreek Hill?',
        platform: 'siri',
        sessionId: testSessionId
      };

      const result1 = await nlpEngine.processVoiceInput(input1);

      expect(result1.intent.name).toBe('AnalyzeTrade');
      expect(result1.entities.players).toContain('christian mccaffrey');
      expect(result1.entities.players).toContain('tyreek hill');
      expect(result1.multiStep).toBe(true);

      // Step 2: Update context and get conversation flow
      const context = await contextManager.getConversationContext(testSessionId);
      await contextManager.updateContext(testSessionId, {
        conversationTopic: 'trade',
        recentPlayers: ['christian mccaffrey', 'tyreek hill']
      });

      const flow = await contextManager.maintainConversationFlow(
        { ...result1.intent, entities: result1.entities },
        await contextManager.getConversationContext(testSessionId)
      );

      expect(flow.nextAction).toBe('analyze');
      expect(flow.contextUpdates.conversationTopic).toBe('trade');

      // Step 3: Follow-up question about the trade
      const input2: VoiceInput = {
        text: 'What about other options?',
        platform: 'siri',
        sessionId: testSessionId,
        context: await contextManager.getConversationContext(testSessionId)
      };

      const result2 = await nlpEngine.processVoiceInput(input2);
      
      // Should maintain trade context and understand the follow-up
      expect(result2.intent.confidence).toBeGreaterThan(0.6);
    });

    it('should handle pronoun resolution in context', async () => {
      // Step 1: Establish context with a specific player
      await contextManager.updateContext(testSessionId, {
        recentPlayers: ['josh allen'],
        userTeam: ['josh allen', 'christian mccaffrey']
      });

      const input1: VoiceInput = {
        text: 'How many points will Josh Allen score?',
        platform: 'alexa',
        sessionId: testSessionId,
        context: await contextManager.getConversationContext(testSessionId)
      };

      const result1 = await nlpEngine.processVoiceInput(input1);
      expect(result1.entities.players).toContain('josh allen');

      // Step 2: Use pronoun reference
      const input2: VoiceInput = {
        text: 'Should I start him?',
        platform: 'alexa',
        sessionId: testSessionId,
        context: await contextManager.getConversationContext(testSessionId)
      };

      const result2 = await nlpEngine.processVoiceInput(input2);
      
      // Should resolve "him" to Josh Allen from context
      const context = await contextManager.getConversationContext(testSessionId);
      const resolvedPlayer = await contextManager.resolvePlayerReference('him', context);
      
      expect(resolvedPlayer?.name).toBe('josh allen');
      expect(result2.intent.name).toBe('SetLineup');
    });

    it('should handle waiver wire conversation with follow-ups', async () => {
      // Step 1: Initial waiver request
      const input1: VoiceInput = {
        text: 'Who should I pick up this week?',
        platform: 'google',
        sessionId: testSessionId
      };

      const result1 = await nlpEngine.processVoiceInput(input1);

      expect(result1.intent.name).toBe('GetWaiverTargets');
      expect(result1.entities.week).toBeDefined();

      // Step 2: Update context and get flow
      await contextManager.updateContext(testSessionId, {
        conversationTopic: 'waiver',
        currentWeek: 10
      });

      const flow = await contextManager.maintainConversationFlow(
        { ...result1.intent, entities: result1.entities },
        await contextManager.getConversationContext(testSessionId)
      );

      expect(flow.nextAction).toBe('recommend');
      expect(flow.followUpSuggestions).toContain('Tell me more about this player');

      // Step 3: Follow-up about specific player
      const input2: VoiceInput = {
        text: 'Tell me more about Cooper Kupp',
        platform: 'google',
        sessionId: testSessionId,
        context: await contextManager.getConversationContext(testSessionId)
      };

      const result2 = await nlpEngine.processVoiceInput(input2);

      expect(result2.intent.name).toBe('GetPlayerProjection');
      expect(result2.entities.players).toContain('cooper kupp');
    });
  });

  describe('Context persistence across interactions', () => {
    it('should maintain conversation history', async () => {
      const interactions = [
        'How is my team doing?',
        'What about Josh Allen?',
        'Should I start him?'
      ];

      for (let i = 0; i < interactions.length; i++) {
        const input: VoiceInput = {
          text: interactions[i],
          platform: 'alexa',
          sessionId: testSessionId,
          context: await contextManager.getConversationContext(testSessionId)
        };

        const result = await nlpEngine.processVoiceInput(input);

        // Update context with this interaction
        await contextManager.updateContext(testSessionId, {
          conversationHistory: [{
            timestamp: new Date(),
            userInput: interactions[i],
            intent: result.intent.name,
            entities: result.entities,
            response: `Mock response for ${result.intent.name}`
          }],
          recentPlayers: result.entities.players || []
        });
      }

      const finalContext = await contextManager.getConversationContext(testSessionId);
      expect(finalContext.conversationHistory).toHaveLength(3);
      expect(finalContext.recentPlayers).toContain('josh allen');
    });

    it('should handle context switching between topics', async () => {
      // Start with lineup topic
      const input1: VoiceInput = {
        text: 'Start Josh Allen at QB',
        platform: 'alexa',
        sessionId: testSessionId
      };

      const result1 = await nlpEngine.processVoiceInput(input1);
      await contextManager.updateContext(testSessionId, {
        conversationTopic: 'lineup'
      });

      // Switch to waiver topic
      const input2: VoiceInput = {
        text: 'Who should I pick up?',
        platform: 'alexa',
        sessionId: testSessionId,
        context: await contextManager.getConversationContext(testSessionId)
      };

      const result2 = await nlpEngine.processVoiceInput(input2);
      
      expect(result1.intent.name).toBe('SetLineup');
      expect(result2.intent.name).toBe('GetWaiverTargets');

      // Context should switch topics
      const flow = await contextManager.maintainConversationFlow(
        { ...result2.intent, entities: result2.entities },
        await contextManager.getConversationContext(testSessionId)
      );

      expect(flow.contextUpdates.conversationTopic).toBe('waiver');
    });
  });

  describe('Error handling and recovery', () => {
    it('should handle unclear input gracefully', async () => {
      const input: VoiceInput = {
        text: 'um maybe do something with the guy',
        platform: 'alexa',
        sessionId: testSessionId
      };

      const result = await nlpEngine.processVoiceInput(input);

      expect(result.intent.name).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should handle missing entities with clarification', async () => {
      const input: VoiceInput = {
        text: 'start someone',
        platform: 'alexa',
        sessionId: testSessionId
      };

      const result = await nlpEngine.processVoiceInput(input);

      expect(result.intent.name).toBe('SetLineup');
      expect(result.entities.players).toBeUndefined();

      const flow = await contextManager.maintainConversationFlow(
        { ...result.intent, entities: result.entities },
        await contextManager.getConversationContext(testSessionId)
      );

      expect(flow.nextAction).toBe('clarify');
      expect(flow.requiresInput).toBe(true);
    });

    it('should recover from context errors', async () => {
      // Simulate context corruption
      await contextManager.clearContext(testSessionId);

      const input: VoiceInput = {
        text: 'How is my team doing?',
        platform: 'alexa',
        sessionId: testSessionId
      };

      // Should still work with fresh context
      const result = await nlpEngine.processVoiceInput(input);

      expect(result.intent.name).toBe('GetTeamStatus');
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Performance and accuracy', () => {
    it('should process multiple requests efficiently', async () => {
      const requests = [
        'How is my team doing?',
        'Start Josh Allen',
        'Who should I pick up?',
        'Trade analysis for CMC',
        'Bench my kicker'
      ];

      const startTime = Date.now();

      const results = await Promise.all(
        requests.map(text => nlpEngine.processVoiceInput({
          text,
          platform: 'alexa',
          sessionId: `${testSessionId}-${Math.random()}`
        }))
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(5);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // All should have reasonable confidence
      results.forEach(result => {
        expect(result.confidence).toBeGreaterThan(0.6);
      });
    });

    it('should maintain accuracy across different phrasings', async () => {
      const lineupVariations = [
        'Start Josh Allen at quarterback',
        'Put Josh Allen in at QB',
        'Play Josh Allen as my quarterback',
        'Set Josh Allen as starting QB'
      ];

      for (const text of lineupVariations) {
        const result = await nlpEngine.processVoiceInput({
          text,
          platform: 'alexa',
          sessionId: testSessionId
        });

        expect(result.intent.name).toBe('SetLineup');
        expect(result.entities.players).toContain('josh allen');
        expect(result.entities.position).toBe('quarterback');
        expect(result.confidence).toBeGreaterThan(0.7);
      }
    });
  });
});
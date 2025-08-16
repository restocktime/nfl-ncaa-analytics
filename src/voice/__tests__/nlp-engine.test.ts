import { NLPEngine } from '../nlp/nlp-engine';
import { VoiceInput, ConversationContext } from '../types/voice.types';

describe('NLPEngine', () => {
  let nlpEngine: NLPEngine;
  let mockContext: ConversationContext;

  beforeEach(() => {
    nlpEngine = new NLPEngine();
    mockContext = {
      sessionId: 'test-session',
      userId: 'test-user',
      currentLeague: 'test-league',
      conversationTopic: null,
      pendingActions: [],
      entityContext: {},
      lastInteraction: new Date(),
      currentWeek: 10,
      userTeam: ['josh allen', 'christian mccaffrey'],
      recentPlayers: ['josh allen'],
      lastPosition: null,
      conversationHistory: []
    };
  });

  describe('processVoiceInput', () => {
    it('should process team status request correctly', async () => {
      const input: VoiceInput = {
        text: 'How is my team doing this week?',
        platform: 'alexa',
        sessionId: 'test-session',
        context: mockContext
      };

      const result = await nlpEngine.processVoiceInput(input);

      expect(result.intent.name).toBe('GetTeamStatus');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.originalText).toBe(input.text);
      expect(result.normalizedText).toBe('how is my team doing this week');
    });

    it('should process player projection request correctly', async () => {
      const input: VoiceInput = {
        text: 'How many points will Josh Allen score?',
        platform: 'google',
        sessionId: 'test-session',
        context: mockContext
      };

      const result = await nlpEngine.processVoiceInput(input);

      expect(result.intent.name).toBe('GetPlayerProjection');
      expect(result.entities.players).toContain('josh allen');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should process lineup change request correctly', async () => {
      const input: VoiceInput = {
        text: 'Start Christian McCaffrey at running back',
        platform: 'siri',
        sessionId: 'test-session',
        context: mockContext
      };

      const result = await nlpEngine.processVoiceInput(input);

      expect(result.intent.name).toBe('SetLineup');
      expect(result.entities.players).toContain('christian mccaffrey');
      expect(result.entities.position).toBe('running back');
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should process waiver wire request correctly', async () => {
      const input: VoiceInput = {
        text: 'Who should I pick up this week?',
        platform: 'alexa',
        sessionId: 'test-session',
        context: mockContext
      };

      const result = await nlpEngine.processVoiceInput(input);

      expect(result.intent.name).toBe('GetWaiverTargets');
      expect(result.entities.week).toBe(10); // From context
    });

    it('should process trade analysis request correctly', async () => {
      const input: VoiceInput = {
        text: 'Should I trade CMC for Tyreek Hill?',
        platform: 'google',
        sessionId: 'test-session',
        context: mockContext
      };

      const result = await nlpEngine.processVoiceInput(input);

      expect(result.intent.name).toBe('AnalyzeTrade');
      expect(result.entities.players).toContain('christian mccaffrey');
      expect(result.multiStep).toBe(true);
    });
  });

  describe('extractEntities', () => {
    it('should extract player names correctly', async () => {
      const entities = await nlpEngine.extractEntities('start josh allen at quarterback');

      expect(entities.players).toContain('josh allen');
      expect(entities.position).toBe('quarterback');
    });

    it('should extract position abbreviations correctly', async () => {
      const entities = await nlpEngine.extractEntities('bench my rb');

      expect(entities.position).toBe('running back');
    });

    it('should extract week numbers correctly', async () => {
      const entities = await nlpEngine.extractEntities('projections for week 12');

      expect(entities.week).toBe(12);
    });

    it('should extract team names correctly', async () => {
      const entities = await nlpEngine.extractEntities('patriots defense this week');

      expect(entities.team).toBe('patriots');
    });

    it('should extract point values correctly', async () => {
      const entities = await nlpEngine.extractEntities('will he score 25 points');

      expect(entities.number).toBe(25);
    });

    it('should handle multiple entities in one text', async () => {
      const entities = await nlpEngine.extractEntities('start josh allen at qb for week 10');

      expect(entities.players).toContain('josh allen');
      expect(entities.position).toBe('quarterback');
      expect(entities.week).toBe(10);
    });
  });

  describe('classifyIntent', () => {
    it('should classify team status intents correctly', async () => {
      const testCases = [
        'how is my team doing',
        'team status',
        'my team performance',
        'team summary'
      ];

      for (const text of testCases) {
        const intent = await nlpEngine.classifyIntent(text, mockContext);
        expect(intent.name).toBe('GetTeamStatus');
        expect(intent.confidence).toBeGreaterThan(0.6);
      }
    });

    it('should classify player projection intents correctly', async () => {
      const testCases = [
        'how many points will mahomes score',
        'josh allen projection',
        'tell me about cooper kupp'
      ];

      for (const text of testCases) {
        const intent = await nlpEngine.classifyIntent(text, mockContext);
        expect(intent.name).toBe('GetPlayerProjection');
        expect(intent.confidence).toBeGreaterThan(0.6);
      }
    });

    it('should classify lineup change intents correctly', async () => {
      const testCases = [
        'start derrick henry',
        'bench my quarterback',
        'sit travis kelce',
        'play cooper kupp'
      ];

      for (const text of testCases) {
        const intent = await nlpEngine.classifyIntent(text, mockContext);
        expect(intent.name).toBe('SetLineup');
        expect(intent.confidence).toBeGreaterThan(0.6);
      }
    });

    it('should boost confidence with relevant context', async () => {
      const contextWithLineupTopic = {
        ...mockContext,
        conversationTopic: 'lineup' as const
      };

      const intent = await nlpEngine.classifyIntent('start josh allen', contextWithLineupTopic);
      
      expect(intent.name).toBe('SetLineup');
      expect(intent.confidence).toBeGreaterThan(0.8);
    });

    it('should handle unknown intents gracefully', async () => {
      const intent = await nlpEngine.classifyIntent('what is the weather today', mockContext);
      
      expect(intent.name).toBe('unknown');
      expect(intent.confidence).toBe(0);
    });
  });

  describe('resolveAmbiguity', () => {
    it('should resolve player names using context', async () => {
      const entities = {
        players: ['allen']
      };

      const resolved = await nlpEngine.resolveAmbiguity(entities, mockContext);

      expect(resolved.players).toContain('josh allen');
    });

    it('should resolve week from context when missing', async () => {
      const entities = {
        players: ['josh allen']
      };

      const resolved = await nlpEngine.resolveAmbiguity(entities, mockContext);

      expect(resolved.week).toBe(10);
    });

    it('should resolve position ambiguity', async () => {
      const entities = {
        position: 'back'
      };

      const contextWithQB = {
        ...mockContext,
        lastPosition: 'quarterback'
      };

      const resolved = await nlpEngine.resolveAmbiguity(entities, contextWithQB);

      expect(resolved.position).toBe('quarterback');
    });

    it('should handle entities without ambiguity', async () => {
      const entities = {
        players: ['josh allen'],
        position: 'quarterback',
        week: 12
      };

      const resolved = await nlpEngine.resolveAmbiguity(entities, mockContext);

      expect(resolved).toEqual(entities);
    });
  });

  describe('player name recognition', () => {
    it('should recognize common player nicknames', async () => {
      const testCases = [
        { input: 'start cmc', expected: 'christian mccaffrey' },
        { input: 'bench mahomes', expected: 'patrick mahomes' },
        { input: 'play kupp', expected: 'cooper kupp' }
      ];

      for (const testCase of testCases) {
        const entities = await nlpEngine.extractEntities(testCase.input);
        expect(entities.players).toContain(testCase.expected);
      }
    });

    it('should handle partial name matches', async () => {
      const entities = await nlpEngine.extractEntities('how is allen doing');
      
      // Should resolve to josh allen based on context
      const resolved = await nlpEngine.resolveAmbiguity(entities, mockContext);
      expect(resolved.players).toContain('josh allen');
    });

    it('should handle multiple player names in one request', async () => {
      const entities = await nlpEngine.extractEntities('trade josh allen for patrick mahomes');
      
      expect(entities.players).toContain('josh allen');
      expect(entities.players).toContain('patrick mahomes');
    });
  });

  describe('confidence scoring', () => {
    it('should assign higher confidence to exact matches', async () => {
      const exactMatch = await nlpEngine.classifyIntent('how is my team doing', mockContext);
      const partialMatch = await nlpEngine.classifyIntent('team', mockContext);

      expect(exactMatch.confidence).toBeGreaterThan(partialMatch.confidence);
    });

    it('should require confirmation for low confidence intents', async () => {
      const input: VoiceInput = {
        text: 'maybe start someone',
        platform: 'alexa',
        sessionId: 'test-session',
        context: mockContext
      };

      const result = await nlpEngine.processVoiceInput(input);
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should identify multi-step intents correctly', async () => {
      const input: VoiceInput = {
        text: 'should I trade my running back',
        platform: 'alexa',
        sessionId: 'test-session',
        context: mockContext
      };

      const result = await nlpEngine.processVoiceInput(input);
      expect(result.multiStep).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle empty input gracefully', async () => {
      const input: VoiceInput = {
        text: '',
        platform: 'alexa',
        sessionId: 'test-session'
      };

      await expect(nlpEngine.processVoiceInput(input)).rejects.toThrow();
    });

    it('should handle malformed input gracefully', async () => {
      const input: VoiceInput = {
        text: '!@#$%^&*()',
        platform: 'alexa',
        sessionId: 'test-session'
      };

      const result = await nlpEngine.processVoiceInput(input);
      expect(result.intent.name).toBe('unknown');
    });

    it('should handle missing context gracefully', async () => {
      const input: VoiceInput = {
        text: 'how is my team doing',
        platform: 'alexa',
        sessionId: 'test-session'
      };

      const result = await nlpEngine.processVoiceInput(input);
      expect(result.intent.name).toBe('GetTeamStatus');
    });
  });
});
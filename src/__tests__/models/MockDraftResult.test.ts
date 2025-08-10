import { MockDraftResult } from '../../models/MockDraftResult';
import { MockDraftResult as IMockDraftResult, DraftPick } from '../../types/espn-draft.types';

describe('MockDraftResult Model', () => {
  const validPicks: DraftPick[] = [
    {
      pickNumber: 1,
      round: 1,
      playerId: 'player1',
      playerName: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      adp: 1.2,
      expertRank: 1,
      actualPick: 1,
      valueScore: 0.2,
    },
    {
      pickNumber: 2,
      round: 1,
      playerId: 'player2',
      playerName: 'Austin Ekeler',
      position: 'RB',
      team: 'LAC',
      adp: 3.5,
      expertRank: 3,
      actualPick: 2,
      valueScore: 1.5,
    },
  ];

  const validMockDraftData: IMockDraftResult = {
    draftId: 'draft123',
    leagueSize: 12,
    scoringFormat: 'PPR',
    picks: validPicks,
    expertAnalysis: 'Strong RB-heavy start with good value picks',
    draftDate: new Date('2025-01-01T12:00:00Z'),
  };

  describe('Constructor', () => {
    it('should create instance with valid data', () => {
      const mockDraft = new MockDraftResult(validMockDraftData);
      
      expect(mockDraft.draftId).toBe('draft123');
      expect(mockDraft.leagueSize).toBe(12);
      expect(mockDraft.scoringFormat).toBe('PPR');
      expect(mockDraft.picks).toEqual(validPicks);
      expect(mockDraft.expertAnalysis).toBe('Strong RB-heavy start with good value picks');
      expect(mockDraft.draftDate).toEqual(new Date('2025-01-01T12:00:00Z'));
    });

    it('should create instance with default values for missing data', () => {
      const mockDraft = new MockDraftResult({});
      
      expect(mockDraft.draftId).toBe('');
      expect(mockDraft.leagueSize).toBe(12);
      expect(mockDraft.scoringFormat).toBe('PPR');
      expect(mockDraft.picks).toEqual([]);
      expect(mockDraft.expertAnalysis).toBe('');
      expect(mockDraft.draftDate).toBeInstanceOf(Date);
    });
  });

  describe('Validation', () => {
    it('should validate correct data', () => {
      const mockDraft = new MockDraftResult(validMockDraftData);
      const errors = mockDraft.validate();
      
      expect(errors).toHaveLength(0);
      expect(mockDraft.isValid()).toBe(true);
    });

    it('should return errors for missing required fields', () => {
      const mockDraft = new MockDraftResult({});
      const errors = mockDraft.validate();
      
      expect(errors).toContain('Draft ID is required');
      expect(errors).toContain('Scoring format is required');
      expect(errors).toContain('At least one pick is required');
    });

    it('should validate league size range', () => {
      const tooSmall = new MockDraftResult({ ...validMockDraftData, leagueSize: 2 });
      const tooLarge = new MockDraftResult({ ...validMockDraftData, leagueSize: 25 });
      
      expect(tooSmall.validate()).toContain('League size must be between 4 and 20');
      expect(tooLarge.validate()).toContain('League size must be between 4 and 20');
    });

    it('should validate individual picks', () => {
      const invalidPicks: DraftPick[] = [
        {
          pickNumber: 0,
          round: 0,
          playerId: '',
          playerName: '',
          position: '',
          team: 'SF',
          adp: 1.2,
          expertRank: 1,
          actualPick: 0,
          valueScore: 0.2,
        },
      ];
      
      const mockDraft = new MockDraftResult({ ...validMockDraftData, picks: invalidPicks });
      const errors = mockDraft.validate();
      
      expect(errors).toContain('Pick 1: Player ID is required');
      expect(errors).toContain('Pick 1: Player name is required');
      expect(errors).toContain('Pick 1: Position is required');
      expect(errors).toContain('Pick 1: Pick number must be greater than 0');
      expect(errors).toContain('Pick 1: Round must be greater than 0');
      expect(errors).toContain('Pick 1: Actual pick must be greater than 0');
    });

    it('should validate draft date', () => {
      const mockDraft = new MockDraftResult({ ...validMockDraftData, draftDate: new Date('invalid') });
      const errors = mockDraft.validate();
      
      expect(errors).toContain('Draft date is invalid');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const mockDraft = new MockDraftResult(validMockDraftData);
      const json = mockDraft.toJSON();
      
      expect(json).toEqual(validMockDraftData);
    });

    it('should deserialize from JSON correctly', () => {
      const mockDraft = MockDraftResult.fromJSON(validMockDraftData);
      
      expect(mockDraft.draftId).toBe(validMockDraftData.draftId);
      expect(mockDraft.leagueSize).toBe(validMockDraftData.leagueSize);
      expect(mockDraft.picks).toEqual(validMockDraftData.picks);
    });

    it('should handle numeric string conversion in fromJSON', () => {
      const jsonData = {
        ...validMockDraftData,
        leagueSize: '10',
      };
      
      const mockDraft = MockDraftResult.fromJSON(jsonData);
      
      expect(mockDraft.leagueSize).toBe(10);
    });
  });

  describe('Draft Analysis', () => {
    it('should calculate total rounds correctly', () => {
      const mockDraft = new MockDraftResult(validMockDraftData);
      
      expect(mockDraft.getTotalRounds()).toBe(1);
    });

    it('should get picks by round', () => {
      const mockDraft = new MockDraftResult(validMockDraftData);
      const round1Picks = mockDraft.getPicksByRound(1);
      
      expect(round1Picks).toHaveLength(2);
      expect(round1Picks[0].playerName).toBe('Christian McCaffrey');
    });

    it('should get picks by position', () => {
      const mockDraft = new MockDraftResult(validMockDraftData);
      const rbPicks = mockDraft.getPicksByPosition('RB');
      
      expect(rbPicks).toHaveLength(2);
      expect(rbPicks[0].playerName).toBe('Christian McCaffrey');
    });

    it('should calculate ADP by position', () => {
      const mockDraft = new MockDraftResult(validMockDraftData);
      const rbADP = mockDraft.getADPByPosition('RB');
      
      expect(rbADP).toBe(1.5); // (1 + 2) / 2
    });

    it('should return 0 ADP for position with no picks', () => {
      const mockDraft = new MockDraftResult(validMockDraftData);
      const qbADP = mockDraft.getADPByPosition('QB');
      
      expect(qbADP).toBe(0);
    });

    it('should get first pick by position', () => {
      const mockDraft = new MockDraftResult(validMockDraftData);
      const firstPicks = mockDraft.getFirstPickByPosition();
      
      expect(firstPicks.get('rb')).toBe(1);
    });
  });

  describe('Strategy Analysis', () => {
    it('should analyze early strategy', () => {
      const mockDraft = new MockDraftResult(validMockDraftData);
      const strategy = mockDraft.analyzeEarlyStrategy(3);
      
      expect(strategy.positions).toEqual(['RB', 'RB']);
      expect(strategy.strategy).toBe('RB-heavy strategy');
      expect(strategy.riskLevel).toBe('CONSERVATIVE');
    });

    it('should identify WR-heavy strategy', () => {
      const wrPicks: DraftPick[] = [
        { ...validPicks[0], position: 'WR', playerName: 'Tyreek Hill' },
        { ...validPicks[1], position: 'WR', playerName: 'Davante Adams' },
      ];
      
      const mockDraft = new MockDraftResult({ ...validMockDraftData, picks: wrPicks });
      const strategy = mockDraft.analyzeEarlyStrategy(3);
      
      expect(strategy.strategy).toBe('WR-heavy strategy');
      expect(strategy.riskLevel).toBe('AGGRESSIVE');
    });

    it('should identify early QB strategy', () => {
      const qbPicks: DraftPick[] = [
        { ...validPicks[0], position: 'QB', playerName: 'Josh Allen' },
        { ...validPicks[1], position: 'RB', playerName: 'Austin Ekeler' },
      ];
      
      const mockDraft = new MockDraftResult({ ...validMockDraftData, picks: qbPicks });
      const strategy = mockDraft.analyzeEarlyStrategy(3);
      
      expect(strategy.strategy).toBe('Early QB strategy');
      expect(strategy.riskLevel).toBe('AGGRESSIVE');
    });
  });

  describe('Value Analysis', () => {
    it('should calculate value scores', () => {
      const mockDraft = new MockDraftResult(validMockDraftData);
      const picksWithValue = mockDraft.calculateValueScores();
      
      expect(picksWithValue[0].valueScore).toBe(0.2); // 1.2 - 1
      expect(picksWithValue[1].valueScore).toBe(1.5); // 3.5 - 2
    });

    it('should handle zero ADP in value calculation', () => {
      const picksWithZeroADP: DraftPick[] = [
        { ...validPicks[0], adp: 0 },
      ];
      
      const mockDraft = new MockDraftResult({ ...validMockDraftData, picks: picksWithZeroADP });
      const picksWithValue = mockDraft.calculateValueScores();
      
      expect(picksWithValue[0].valueScore).toBe(0);
    });
  });

  describe('Summary Statistics', () => {
    it('should generate correct summary stats', () => {
      const mockDraft = new MockDraftResult(validMockDraftData);
      const stats = mockDraft.getSummaryStats();
      
      expect(stats.totalPicks).toBe(2);
      expect(stats.rounds).toBe(1);
      expect(stats.positionBreakdown.RB).toBe(2);
      expect(stats.averageValueScore).toBe(0.85); // (0.2 + 1.5) / 2
      expect(stats.bestValue?.playerName).toBe('Austin Ekeler');
      expect(stats.worstValue?.playerName).toBe('Christian McCaffrey');
    });

    it('should handle empty picks in summary stats', () => {
      const mockDraft = new MockDraftResult({ ...validMockDraftData, picks: [] });
      const stats = mockDraft.getSummaryStats();
      
      expect(stats.totalPicks).toBe(0);
      expect(stats.rounds).toBe(0);
      expect(stats.averageValueScore).toBe(0);
      expect(stats.bestValue).toBeNull();
      expect(stats.worstValue).toBeNull();
    });
  });
});
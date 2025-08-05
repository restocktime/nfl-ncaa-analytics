import 'reflect-metadata';
import { validate } from 'class-validator';
import { 
  ProspectAnalysis,
  DraftProjection,
  ReadinessScore,
  TeamFitScore,
  ComparablePlayer,
  DraftRound,
  ReadinessLevel,
  SchemeType
} from '../../models/ProspectAnalysis';
import { Position } from '../../types/common.types';

describe('ProspectAnalysis Models', () => {
  describe('DraftProjection', () => {
    let validDraftProjection: any;

    beforeEach(() => {
      validDraftProjection = {
        projectedRound: DraftRound.SECOND,
        projectedPick: 45,
        confidence: 0.75,
        interestedTeams: ['team-1', 'team-2', 'team-3'],
        draftAnalysis: 'Strong second round prospect with high upside'
      };
    });

    it('should validate valid draft projection', async () => {
      const projection = new DraftProjection(validDraftProjection);
      const errors = await validate(projection);
      expect(errors).toHaveLength(0);
    });

    it('should validate projected pick range', async () => {
      const invalidProjection = new DraftProjection({
        ...validDraftProjection,
        projectedPick: 350 // Invalid - too high
      });
      const errors = await validate(invalidProjection);
      expect(errors.some(error => error.property === 'projectedPick')).toBe(true);
    });

    it('should validate confidence range', async () => {
      const invalidProjection = new DraftProjection({
        ...validDraftProjection,
        confidence: 1.5 // Invalid - too high
      });
      const errors = await validate(invalidProjection);
      expect(errors.some(error => error.property === 'confidence')).toBe(true);
    });

    it('should identify early round picks correctly', () => {
      const firstRound = new DraftProjection({ ...validDraftProjection, projectedRound: DraftRound.FIRST });
      const thirdRound = new DraftProjection({ ...validDraftProjection, projectedRound: DraftRound.THIRD });
      const fourthRound = new DraftProjection({ ...validDraftProjection, projectedRound: DraftRound.FOURTH });

      expect(firstRound.isEarlyRoundPick()).toBe(true);
      expect(thirdRound.isEarlyRoundPick()).toBe(true);
      expect(fourthRound.isEarlyRoundPick()).toBe(false);
    });

    it('should identify day 3 picks correctly', () => {
      const thirdRound = new DraftProjection({ ...validDraftProjection, projectedRound: DraftRound.THIRD });
      const fourthRound = new DraftProjection({ ...validDraftProjection, projectedRound: DraftRound.FOURTH });
      const seventhRound = new DraftProjection({ ...validDraftProjection, projectedRound: DraftRound.SEVENTH });
      const undrafted = new DraftProjection({ ...validDraftProjection, projectedRound: DraftRound.UNDRAFTED });

      expect(thirdRound.isDayThreePick()).toBe(false);
      expect(fourthRound.isDayThreePick()).toBe(true);
      expect(seventhRound.isDayThreePick()).toBe(true);
      expect(undrafted.isDayThreePick()).toBe(false);
    });

    it('should identify undrafted players correctly', () => {
      const drafted = new DraftProjection({ ...validDraftProjection, projectedRound: DraftRound.SEVENTH });
      const undrafted = new DraftProjection({ ...validDraftProjection, projectedRound: DraftRound.UNDRAFTED });

      expect(drafted.isUndrafted()).toBe(false);
      expect(undrafted.isUndrafted()).toBe(true);
    });

    it('should calculate draft value correctly', () => {
      const firstPick = new DraftProjection({ ...validDraftProjection, projectedPick: 1 });
      const lastPick = new DraftProjection({ ...validDraftProjection, projectedPick: 300 });
      const undrafted = new DraftProjection({ ...validDraftProjection, projectedRound: DraftRound.UNDRAFTED });

      expect(firstPick.getDraftValue()).toBeCloseTo(0.997, 2);
      expect(lastPick.getDraftValue()).toBe(0);
      expect(undrafted.getDraftValue()).toBe(0);
    });
  });

  describe('ReadinessScore', () => {
    let validReadinessScore: any;

    beforeEach(() => {
      validReadinessScore = {
        level: ReadinessLevel.YEAR_ONE_CONTRIBUTOR,
        overallScore: 78,
        physicalReadiness: 85,
        mentalReadiness: 75,
        technicalSkills: 80,
        strengths: ['Strong arm', 'Good mobility'],
        weaknesses: ['Needs to improve accuracy under pressure']
      };
    });

    it('should validate valid readiness score', async () => {
      const readiness = new ReadinessScore(validReadinessScore);
      const errors = await validate(readiness);
      expect(errors).toHaveLength(0);
    });

    it('should validate score ranges', async () => {
      const invalidReadiness = new ReadinessScore({
        ...validReadinessScore,
        overallScore: 150 // Invalid - too high
      });
      const errors = await validate(invalidReadiness);
      expect(errors.some(error => error.property === 'overallScore')).toBe(true);
    });

    it('should identify NFL ready players correctly', () => {
      const immediateStarter = new ReadinessScore({ ...validReadinessScore, level: ReadinessLevel.IMMEDIATE_STARTER });
      const yearOneContributor = new ReadinessScore({ ...validReadinessScore, level: ReadinessLevel.YEAR_ONE_CONTRIBUTOR });
      const developmental = new ReadinessScore({ ...validReadinessScore, level: ReadinessLevel.DEVELOPMENTAL });

      expect(immediateStarter.isNFLReady()).toBe(true);
      expect(yearOneContributor.isNFLReady()).toBe(true);
      expect(developmental.isNFLReady()).toBe(false);
    });

    it('should calculate development timeline correctly', () => {
      const immediateStarter = new ReadinessScore({ ...validReadinessScore, level: ReadinessLevel.IMMEDIATE_STARTER });
      const developmental = new ReadinessScore({ ...validReadinessScore, level: ReadinessLevel.DEVELOPMENTAL });
      const project = new ReadinessScore({ ...validReadinessScore, level: ReadinessLevel.PROJECT });

      expect(immediateStarter.getDevelopmentTimeline()).toBe(0);
      expect(developmental.getDevelopmentTimeline()).toBe(2);
      expect(project.getDevelopmentTimeline()).toBe(3);
    });

    it('should calculate composite score correctly', () => {
      const readiness = new ReadinessScore(validReadinessScore);
      const expectedScore = (85 * 0.3) + (75 * 0.4) + (80 * 0.3);
      
      expect(readiness.getCompositeScore()).toBeCloseTo(expectedScore, 1);
    });
  });

  describe('TeamFitScore', () => {
    let validTeamFitScore: any;

    beforeEach(() => {
      validTeamFitScore = {
        teamId: 'team-1',
        teamName: 'Test Team',
        overallFit: 82,
        schemeFit: 85,
        positionalNeed: 90,
        culturalFit: 70,
        primaryScheme: SchemeType.PRO_STYLE,
        fitAnalysis: 'Good fit with high positional need'
      };
    });

    it('should validate valid team fit score', async () => {
      const teamFit = new TeamFitScore(validTeamFitScore);
      const errors = await validate(teamFit);
      expect(errors).toHaveLength(0);
    });

    it('should require non-empty team information', async () => {
      const invalidTeamFit = new TeamFitScore({
        ...validTeamFitScore,
        teamId: '' // Invalid - empty
      });
      const errors = await validate(invalidTeamFit);
      expect(errors.some(error => error.property === 'teamId')).toBe(true);
    });

    it('should identify good fits correctly', () => {
      const goodFit = new TeamFitScore({ ...validTeamFitScore, overallFit: 75 });
      const poorFit = new TeamFitScore({ ...validTeamFitScore, overallFit: 65 });

      expect(goodFit.isGoodFit()).toBe(true);
      expect(poorFit.isGoodFit()).toBe(false);
    });

    it('should identify excellent fits correctly', () => {
      const excellentFit = new TeamFitScore({ ...validTeamFitScore, overallFit: 90 });
      const goodFit = new TeamFitScore({ ...validTeamFitScore, overallFit: 80 });

      expect(excellentFit.isExcellentFit()).toBe(true);
      expect(goodFit.isExcellentFit()).toBe(false);
    });

    it('should identify primary weakness correctly', () => {
      const teamFit = new TeamFitScore({
        ...validTeamFitScore,
        schemeFit: 60,
        positionalNeed: 80,
        culturalFit: 90
      });

      expect(teamFit.getPrimaryWeakness()).toBe('scheme');
    });
  });

  describe('ComparablePlayer', () => {
    let validComparablePlayer: any;

    beforeEach(() => {
      validComparablePlayer = {
        playerId: 'comp-1',
        playerName: 'Comparable QB',
        position: Position.QB,
        college: 'State University',
        draftYear: 2020,
        draftRound: DraftRound.SECOND,
        similarityScore: 0.85,
        careerOutcome: 'Pro Bowl',
        similarTraits: ['Strong arm', 'Good mobility', 'Leadership']
      };
    });

    it('should validate valid comparable player', async () => {
      const comparable = new ComparablePlayer(validComparablePlayer);
      const errors = await validate(comparable);
      expect(errors).toHaveLength(0);
    });

    it('should validate similarity score range', async () => {
      const invalidComparable = new ComparablePlayer({
        ...validComparablePlayer,
        similarityScore: 1.5 // Invalid - too high
      });
      const errors = await validate(invalidComparable);
      expect(errors.some(error => error.property === 'similarityScore')).toBe(true);
    });

    it('should identify highly similar players correctly', () => {
      const highlySimilar = new ComparablePlayer({ ...validComparablePlayer, similarityScore: 0.85 });
      const moderatelySimilar = new ComparablePlayer({ ...validComparablePlayer, similarityScore: 0.75 });

      expect(highlySimilar.isHighlySimilar()).toBe(true);
      expect(moderatelySimilar.isHighlySimilar()).toBe(false);
    });

    it('should identify NFL success correctly', () => {
      const proBowler = new ComparablePlayer({ ...validComparablePlayer, careerOutcome: 'Pro Bowl' });
      const allPro = new ComparablePlayer({ ...validComparablePlayer, careerOutcome: 'All-Pro' });
      const starter = new ComparablePlayer({ ...validComparablePlayer, careerOutcome: 'Long-term starter' });
      const backup = new ComparablePlayer({ ...validComparablePlayer, careerOutcome: 'Backup' });

      expect(proBowler.hadNFLSuccess()).toBe(true);
      expect(allPro.hadNFLSuccess()).toBe(true);
      expect(starter.hadNFLSuccess()).toBe(true);
      expect(backup.hadNFLSuccess()).toBe(false);
    });

    it('should calculate years since drafted correctly', () => {
      const currentYear = new Date().getFullYear();
      const comparable = new ComparablePlayer({ ...validComparablePlayer, draftYear: currentYear - 3 });

      expect(comparable.getYearsSinceDrafted()).toBe(3);
    });
  });

  describe('ProspectAnalysis', () => {
    let validProspectAnalysis: any;

    beforeEach(() => {
      validProspectAnalysis = {
        playerId: 'prospect-1',
        playerName: 'Test Prospect',
        position: Position.QB,
        college: 'State University',
        collegeYear: 4,
        draftProjection: {
          projectedRound: DraftRound.SECOND,
          projectedPick: 45,
          confidence: 0.75,
          interestedTeams: ['team-1', 'team-2']
        },
        nflReadiness: {
          level: ReadinessLevel.YEAR_ONE_CONTRIBUTOR,
          overallScore: 78,
          physicalReadiness: 85,
          mentalReadiness: 75,
          technicalSkills: 80
        },
        teamFitAnalysis: [
          {
            teamId: 'team-1',
            teamName: 'Team One',
            overallFit: 85,
            schemeFit: 80,
            positionalNeed: 90,
            culturalFit: 85,
            primaryScheme: SchemeType.PRO_STYLE
          },
          {
            teamId: 'team-2',
            teamName: 'Team Two',
            overallFit: 75,
            schemeFit: 70,
            positionalNeed: 80,
            culturalFit: 75,
            primaryScheme: SchemeType.SPREAD_OFFENSE
          }
        ],
        comparablePlayerAnalysis: [
          {
            playerId: 'comp-1',
            playerName: 'Comparable One',
            position: Position.QB,
            college: 'State University',
            draftYear: 2020,
            draftRound: DraftRound.SECOND,
            similarityScore: 0.85,
            careerOutcome: 'Pro Bowl'
          },
          {
            playerId: 'comp-2',
            playerName: 'Comparable Two',
            position: Position.QB,
            college: 'Tech University',
            draftYear: 2019,
            draftRound: DraftRound.THIRD,
            similarityScore: 0.75,
            careerOutcome: 'Backup'
          }
        ],
        bustRisk: 35,
        overallAnalysis: 'Strong prospect with good upside'
      };
    });

    it('should validate valid prospect analysis', async () => {
      const prospect = new ProspectAnalysis(validProspectAnalysis);
      const errors = await validate(prospect, { skipMissingProperties: true });
      expect(prospect.playerId).toBe('prospect-1');
      expect(prospect.playerName).toBe('Test Prospect');
    });

    it('should validate college year range', async () => {
      const invalidProspect = new ProspectAnalysis({
        ...validProspectAnalysis,
        collegeYear: 6 // Invalid - too high
      });
      const errors = await validate(invalidProspect);
      expect(errors.some(error => error.property === 'collegeYear')).toBe(true);
    });

    it('should get best team fit correctly', () => {
      const prospect = new ProspectAnalysis(validProspectAnalysis);
      const bestFit = prospect.getBestTeamFit();

      expect(bestFit).toBeDefined();
      expect(bestFit!.teamId).toBe('team-1');
      expect(bestFit!.overallFit).toBe(85);
    });

    it('should get excellent fit teams correctly', () => {
      const prospect = new ProspectAnalysis(validProspectAnalysis);
      const excellentFits = prospect.getExcellentFitTeams();

      expect(excellentFits).toHaveLength(1); // One at exactly 85% in test data
      
      // Test with additional excellent fit
      prospect.teamFitAnalysis[1].overallFit = 90;
      const excellentFitsUpdated = prospect.getExcellentFitTeams();
      expect(excellentFitsUpdated).toHaveLength(2);
    });

    it('should get most similar player correctly', () => {
      const prospect = new ProspectAnalysis(validProspectAnalysis);
      const mostSimilar = prospect.getMostSimilarPlayer();

      expect(mostSimilar).toBeDefined();
      expect(mostSimilar!.playerId).toBe('comp-1');
      expect(mostSimilar!.similarityScore).toBe(0.85);
    });

    it('should get successful comparables correctly', () => {
      const prospect = new ProspectAnalysis(validProspectAnalysis);
      const successfulComps = prospect.getSuccessfulComparables();

      expect(successfulComps).toHaveLength(1);
      expect(successfulComps[0].playerId).toBe('comp-1');
      expect(successfulComps[0].careerOutcome).toBe('Pro Bowl');
    });

    it('should calculate overall grade correctly', () => {
      const prospect = new ProspectAnalysis(validProspectAnalysis);
      const grade = prospect.getOverallGrade();

      expect(grade).toBeGreaterThanOrEqual(0);
      expect(grade).toBeLessThanOrEqual(100);
      expect(grade).toBeGreaterThan(50); // Should be above average for this prospect
    });

    it('should assess risk correctly', () => {
      const prospect = new ProspectAnalysis(validProspectAnalysis);
      const riskLevel = prospect.getRiskAssessment();

      expect(['Low', 'Medium', 'High']).toContain(riskLevel);
      expect(riskLevel).toBe('Medium'); // 35% bust risk should be medium
    });

    it('should assess early round worthiness correctly', () => {
      const prospect = new ProspectAnalysis(validProspectAnalysis);
      const isWorthy = prospect.isEarlyRoundWorthy();

      expect(typeof isWorthy).toBe('boolean');
      // This prospect should be early round worthy (2nd round, NFL ready, good grade)
      expect(isWorthy).toBe(true);
    });

    it('should provide development projection correctly', () => {
      const prospect = new ProspectAnalysis(validProspectAnalysis);
      const projection = prospect.getDevelopmentProjection();

      expect(projection.timeline).toBeGreaterThanOrEqual(0);
      expect(projection.ceiling).toBeDefined();
      expect(projection.floor).toBeDefined();
      expect(typeof projection.ceiling).toBe('string');
      expect(typeof projection.floor).toBe('string');
    });

    it('should handle empty arrays gracefully', () => {
      const emptyProspect = new ProspectAnalysis({
        ...validProspectAnalysis,
        teamFitAnalysis: [],
        comparablePlayerAnalysis: []
      });

      expect(emptyProspect.getBestTeamFit()).toBeNull();
      expect(emptyProspect.getMostSimilarPlayer()).toBeNull();
      expect(emptyProspect.getExcellentFitTeams()).toHaveLength(0);
      expect(emptyProspect.getSuccessfulComparables()).toHaveLength(0);
    });

    it('should properly instantiate nested objects', () => {
      const prospect = new ProspectAnalysis(validProspectAnalysis);

      expect(prospect.draftProjection).toBeInstanceOf(DraftProjection);
      expect(prospect.nflReadiness).toBeInstanceOf(ReadinessScore);
      expect(prospect.teamFitAnalysis[0]).toBeInstanceOf(TeamFitScore);
      expect(prospect.comparablePlayerAnalysis[0]).toBeInstanceOf(ComparablePlayer);

      // Test that methods are available
      expect(prospect.draftProjection.isEarlyRoundPick).toBeDefined();
      expect(prospect.nflReadiness.isNFLReady).toBeDefined();
      expect(prospect.teamFitAnalysis[0].isGoodFit).toBeDefined();
      expect(prospect.comparablePlayerAnalysis[0].isHighlySimilar).toBeDefined();
    });
  });
});
import { 
  IsString, 
  IsNumber, 
  ValidateNested, 
  Min, 
  Max,
  IsNotEmpty,
  IsArray,
  IsEnum,
  IsOptional
} from 'class-validator';
import { Type } from 'class-transformer';
import { Position } from '../types/common.types';

export enum DraftRound {
  FIRST = 1,
  SECOND = 2,
  THIRD = 3,
  FOURTH = 4,
  FIFTH = 5,
  SIXTH = 6,
  SEVENTH = 7,
  UNDRAFTED = 8
}

export enum ReadinessLevel {
  IMMEDIATE_STARTER = 'immediate_starter',
  YEAR_ONE_CONTRIBUTOR = 'year_one_contributor',
  DEVELOPMENTAL = 'developmental',
  PROJECT = 'project',
  PRACTICE_SQUAD = 'practice_squad'
}

export enum SchemeType {
  SPREAD_OFFENSE = 'spread_offense',
  PRO_STYLE = 'pro_style',
  AIR_RAID = 'air_raid',
  WEST_COAST = 'west_coast',
  POWER_RUN = 'power_run',
  ZONE_RUN = 'zone_run',
  THREE_FOUR_DEFENSE = '3_4_defense',
  FOUR_THREE_DEFENSE = '4_3_defense',
  NICKEL_DEFENSE = 'nickel_defense',
  COVER_TWO = 'cover_2',
  COVER_THREE = 'cover_3'
}

export class DraftProjection {
  @IsEnum(DraftRound)
  projectedRound!: DraftRound;

  @IsNumber()
  @Min(1)
  @Max(300)
  projectedPick!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @IsArray()
  @IsString({ each: true })
  interestedTeams!: string[];

  @IsOptional()
  @IsString()
  draftAnalysis?: string;

  constructor(data: Partial<DraftProjection> = {}) {
    Object.assign(this, data);
  }

  /**
   * Check if projected as early round pick (rounds 1-3)
   */
  isEarlyRoundPick(): boolean {
    return this.projectedRound <= DraftRound.THIRD;
  }

  /**
   * Check if projected as day 3 pick (rounds 4-7)
   */
  isDayThreePick(): boolean {
    return this.projectedRound >= DraftRound.FOURTH && this.projectedRound <= DraftRound.SEVENTH;
  }

  /**
   * Check if projected as undrafted
   */
  isUndrafted(): boolean {
    return this.projectedRound === DraftRound.UNDRAFTED;
  }

  /**
   * Get draft value score (higher is better)
   */
  getDraftValue(): number {
    if (this.isUndrafted()) return 0;
    
    // Inverse relationship - earlier picks are more valuable
    const maxPicks = 300;
    return (maxPicks - this.projectedPick) / maxPicks;
  }
}

export class ReadinessScore {
  @IsEnum(ReadinessLevel)
  level!: ReadinessLevel;

  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  physicalReadiness!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  mentalReadiness!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  technicalSkills!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengths?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  weaknesses?: string[];

  constructor(data: Partial<ReadinessScore> = {}) {
    Object.assign(this, data);
  }

  /**
   * Check if ready for immediate NFL impact
   */
  isNFLReady(): boolean {
    return this.level === ReadinessLevel.IMMEDIATE_STARTER || 
           this.level === ReadinessLevel.YEAR_ONE_CONTRIBUTOR;
  }

  /**
   * Get development timeline in years
   */
  getDevelopmentTimeline(): number {
    switch (this.level) {
      case ReadinessLevel.IMMEDIATE_STARTER:
        return 0;
      case ReadinessLevel.YEAR_ONE_CONTRIBUTOR:
        return 0.5;
      case ReadinessLevel.DEVELOPMENTAL:
        return 2;
      case ReadinessLevel.PROJECT:
        return 3;
      case ReadinessLevel.PRACTICE_SQUAD:
        return 4;
      default:
        return 2;
    }
  }

  /**
   * Calculate composite readiness score
   */
  getCompositeScore(): number {
    return (this.physicalReadiness * 0.3 + 
            this.mentalReadiness * 0.4 + 
            this.technicalSkills * 0.3);
  }
}

export class TeamFitScore {
  @IsString()
  @IsNotEmpty()
  teamId!: string;

  @IsString()
  @IsNotEmpty()
  teamName!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  overallFit!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  schemeFit!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  positionalNeed!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  culturalFit!: number;

  @IsEnum(SchemeType)
  primaryScheme!: SchemeType;

  @IsOptional()
  @IsString()
  fitAnalysis?: string;

  constructor(data: Partial<TeamFitScore> = {}) {
    Object.assign(this, data);
  }

  /**
   * Check if this is a good fit (>70% overall)
   */
  isGoodFit(): boolean {
    return this.overallFit >= 70;
  }

  /**
   * Check if this is an excellent fit (>85% overall)
   */
  isExcellentFit(): boolean {
    return this.overallFit >= 85;
  }

  /**
   * Get the primary weakness in fit
   */
  getPrimaryWeakness(): string {
    const scores = {
      scheme: this.schemeFit,
      need: this.positionalNeed,
      culture: this.culturalFit
    };

    const lowest = Object.entries(scores).reduce((min, [key, value]) => 
      value < min.value ? { key, value } : min, 
      { key: 'scheme', value: this.schemeFit }
    );

    return lowest.key;
  }
}

export class ComparablePlayer {
  @IsString()
  @IsNotEmpty()
  playerId!: string;

  @IsString()
  @IsNotEmpty()
  playerName!: string;

  @IsEnum(Position)
  position!: Position;

  @IsString()
  @IsNotEmpty()
  college!: string;

  @IsNumber()
  @Min(1990)
  @Max(2030)
  draftYear!: number;

  @IsEnum(DraftRound)
  draftRound!: DraftRound;

  @IsNumber()
  @Min(0)
  @Max(1)
  similarityScore!: number;

  @IsOptional()
  @IsString()
  careerOutcome?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  similarTraits?: string[];

  constructor(data: Partial<ComparablePlayer> = {}) {
    Object.assign(this, data);
  }

  /**
   * Check if this is a highly similar player (>80% similarity)
   */
  isHighlySimilar(): boolean {
    return this.similarityScore >= 0.8;
  }

  /**
   * Check if comparable player had NFL success
   */
  hadNFLSuccess(): boolean {
    return this.careerOutcome === 'Pro Bowl' || 
           this.careerOutcome === 'All-Pro' || 
           this.careerOutcome === 'Long-term starter';
  }

  /**
   * Get years since drafted
   */
  getYearsSinceDrafted(): number {
    return new Date().getFullYear() - this.draftYear;
  }
}

export class ProspectAnalysis {
  @IsString()
  @IsNotEmpty()
  playerId!: string;

  @IsString()
  @IsNotEmpty()
  playerName!: string;

  @IsEnum(Position)
  position!: Position;

  @IsString()
  @IsNotEmpty()
  college!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  collegeYear!: number; // 1=Freshman, 2=Sophomore, etc.

  @ValidateNested()
  @Type(() => DraftProjection)
  draftProjection!: DraftProjection;

  @ValidateNested()
  @Type(() => ReadinessScore)
  nflReadiness!: ReadinessScore;

  @ValidateNested({ each: true })
  @Type(() => TeamFitScore)
  @IsArray()
  teamFitAnalysis!: TeamFitScore[];

  @ValidateNested({ each: true })
  @Type(() => ComparablePlayer)
  @IsArray()
  comparablePlayerAnalysis!: ComparablePlayer[];

  @IsOptional()
  @IsString()
  overallAnalysis?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bustRisk?: number;

  constructor(data: Partial<ProspectAnalysis> = {}) {
    Object.assign(this, data);
    
    // Ensure nested objects are properly instantiated
    if (data.draftProjection) {
      this.draftProjection = new DraftProjection(data.draftProjection);
    }
    if (data.nflReadiness) {
      this.nflReadiness = new ReadinessScore(data.nflReadiness);
    }
    if (data.teamFitAnalysis) {
      this.teamFitAnalysis = data.teamFitAnalysis.map(fit => new TeamFitScore(fit));
    }
    if (data.comparablePlayerAnalysis) {
      this.comparablePlayerAnalysis = data.comparablePlayerAnalysis.map(comp => new ComparablePlayer(comp));
    }
  }

  /**
   * Get the best team fit
   */
  getBestTeamFit(): TeamFitScore | null {
    if (this.teamFitAnalysis.length === 0) return null;
    
    return this.teamFitAnalysis.reduce((best, current) => 
      current.overallFit > best.overallFit ? current : best
    );
  }

  /**
   * Get teams with excellent fit (>85%)
   */
  getExcellentFitTeams(): TeamFitScore[] {
    return this.teamFitAnalysis.filter(fit => fit.isExcellentFit());
  }

  /**
   * Get most similar comparable player
   */
  getMostSimilarPlayer(): ComparablePlayer | null {
    if (this.comparablePlayerAnalysis.length === 0) return null;
    
    return this.comparablePlayerAnalysis.reduce((most, current) => 
      current.similarityScore > most.similarityScore ? current : most
    );
  }

  /**
   * Get comparable players who had NFL success
   */
  getSuccessfulComparables(): ComparablePlayer[] {
    return this.comparablePlayerAnalysis.filter(comp => comp.hadNFLSuccess());
  }

  /**
   * Calculate overall prospect grade (0-100)
   */
  getOverallGrade(): number {
    const draftValue = this.draftProjection.getDraftValue() * 100;
    const readinessScore = this.nflReadiness.getCompositeScore();
    const bestFit = this.getBestTeamFit()?.overallFit || 50;
    const successfulComps = this.getSuccessfulComparables().length;
    const totalComps = this.comparablePlayerAnalysis.length;
    const compSuccessRate = totalComps > 0 ? (successfulComps / totalComps) * 100 : 50;
    
    // Weighted average: 40% draft value, 30% readiness, 20% team fit, 10% comparable success
    return (draftValue * 0.4) + (readinessScore * 0.3) + (bestFit * 0.2) + (compSuccessRate * 0.1);
  }

  /**
   * Get risk assessment
   */
  getRiskAssessment(): 'Low' | 'Medium' | 'High' {
    const bustRisk = this.bustRisk || 50;
    
    if (bustRisk < 30) return 'Low';
    if (bustRisk < 70) return 'Medium';
    return 'High';
  }

  /**
   * Check if prospect is worth early round investment
   */
  isEarlyRoundWorthy(): boolean {
    return this.draftProjection.isEarlyRoundPick() && 
           this.nflReadiness.isNFLReady() && 
           this.getOverallGrade() >= 75;
  }

  /**
   * Get development projection
   */
  getDevelopmentProjection(): {
    timeline: number;
    ceiling: string;
    floor: string;
  } {
    const timeline = this.nflReadiness.getDevelopmentTimeline();
    const grade = this.getOverallGrade();
    
    let ceiling: string;
    let floor: string;
    
    if (grade >= 90) {
      ceiling = 'All-Pro';
      floor = 'Solid starter';
    } else if (grade >= 80) {
      ceiling = 'Pro Bowl';
      floor = 'Rotational player';
    } else if (grade >= 70) {
      ceiling = 'Solid starter';
      floor = 'Backup';
    } else if (grade >= 60) {
      ceiling = 'Rotational player';
      floor = 'Practice squad';
    } else {
      ceiling = 'Backup';
      floor = 'Out of league';
    }
    
    return { timeline, ceiling, floor };
  }
}
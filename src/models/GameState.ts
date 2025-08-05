import { 
  IsNumber, 
  ValidateNested, 
  IsArray, 
  Min, 
  Max,
  IsOptional
} from 'class-validator';
import { Type } from 'class-transformer';
import { Game } from './Game';
import { Team } from './Team';
import { 
  Score, 
  TimeRemaining, 
  FieldPosition, 
  MomentumIndicator, 
  Play, 
  Drive, 
  Penalty 
} from '../types';

export class GameState {
  @ValidateNested()
  @Type(() => Game)
  game!: Game;

  @ValidateNested()
  @Type(() => Object)
  score!: Score;

  @ValidateNested()
  @Type(() => Object)
  timeRemaining!: TimeRemaining;

  @ValidateNested()
  @Type(() => Team)
  possession!: Team;

  @ValidateNested()
  @Type(() => Object)
  fieldPosition!: FieldPosition;

  @IsNumber()
  @Min(1)
  @Max(4)
  down!: number;

  @IsNumber()
  @Min(1)
  @Max(99)
  yardsToGo!: number;

  @ValidateNested()
  @Type(() => Object)
  momentum!: MomentumIndicator;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  lastPlay?: Play;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  drives!: Drive[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  penalties!: Penalty[];

  @ValidateNested()
  @Type(() => Object)
  timeouts!: {
    home: number;
    away: number;
  };

  constructor(data: Partial<GameState> = {}) {
    Object.assign(this, data);
  }

  /**
   * Get the current quarter
   */
  getCurrentQuarter(): number {
    return this.timeRemaining.quarter;
  }

  /**
   * Check if it's the two-minute warning
   */
  isTwoMinuteWarning(): boolean {
    return (this.timeRemaining.quarter === 2 || this.timeRemaining.quarter === 4) &&
           this.timeRemaining.minutes === 2 && this.timeRemaining.seconds === 0;
  }

  /**
   * Check if it's a red zone situation
   */
  isRedZone(): boolean {
    return this.fieldPosition.yardLine <= 20;
  }

  /**
   * Check if it's a goal line situation
   */
  isGoalLine(): boolean {
    return this.fieldPosition.yardLine <= 5;
  }

  /**
   * Get score differential (positive means home team leading)
   */
  getScoreDifferential(): number {
    return this.score.home - this.score.away;
  }

  /**
   * Check if game is in overtime
   */
  isOvertime(): boolean {
    return this.timeRemaining.overtime === true;
  }

  /**
   * Get total game time elapsed in seconds
   */
  getTimeElapsed(): number {
    const quarterTime = 15 * 60; // 15 minutes per quarter
    const completedQuarters = Math.max(0, this.timeRemaining.quarter - 1);
    const currentQuarterElapsed = quarterTime - (this.timeRemaining.minutes * 60 + this.timeRemaining.seconds);
    
    return (completedQuarters * quarterTime) + currentQuarterElapsed;
  }

  /**
   * Check if it's a critical down (3rd or 4th down)
   */
  isCriticalDown(): boolean {
    return this.down >= 3;
  }

  /**
   * Get the team that's not in possession
   */
  getDefendingTeam(): Team {
    return this.possession.id === this.game.homeTeam.id ? this.game.awayTeam : this.game.homeTeam;
  }

  /**
   * Check if possession team is in their own territory
   */
  isInOwnTerritory(): boolean {
    const isHomePossession = this.possession.id === this.game.homeTeam.id;
    const isHomeFieldSide = this.fieldPosition.side === 'home';
    
    return isHomePossession === isHomeFieldSide;
  }

  /**
   * Get yards to end zone
   */
  getYardsToEndZone(): number {
    if (this.isInOwnTerritory()) {
      return 100 - this.fieldPosition.yardLine;
    } else {
      return this.fieldPosition.yardLine;
    }
  }
}
import { LeagueSettings, ScoringRules, RosterRequirements } from '../types/fantasy.types';

export interface LeagueConfigurationStep {
  id: string;
  title: string;
  description: string;
  component: string;
  isComplete: boolean;
  data?: any;
}

export interface LeagueImportData {
  platform: 'ESPN' | 'Yahoo' | 'Sleeper' | 'NFL';
  leagueId: string;
  credentials?: {
    username?: string;
    password?: string;
    apiKey?: string;
  };
}

export class LeagueConfigurationWizard {
  private steps: LeagueConfigurationStep[] = [];
  private currentStep = 0;
  private leagueSettings: Partial<LeagueSettings> = {};

  constructor() {
    this.initializeSteps();
  }

  /**
   * Initialize configuration wizard steps
   */
  private initializeSteps(): void {
    this.steps = [
      {
        id: 'basic-info',
        title: 'Basic League Information',
        description: 'Set up your league name and basic settings',
        component: 'BasicInfoStep',
        isComplete: false
      },
      {
        id: 'scoring-system',
        title: 'Scoring System',
        description: 'Configure how points are awarded',
        component: 'ScoringSystemStep',
        isComplete: false
      },
      {
        id: 'roster-positions',
        title: 'Roster Positions',
        description: 'Define starting lineup requirements',
        component: 'RosterPositionsStep',
        isComplete: false
      },
      {
        id: 'league-rules',
        title: 'League Rules',
        description: 'Set trade deadlines, waiver rules, and playoffs',
        component: 'LeagueRulesStep',
        isComplete: false
      },
      {
        id: 'import-rosters',
        title: 'Import Rosters',
        description: 'Import existing rosters from fantasy platforms',
        component: 'ImportRostersStep',
        isComplete: false
      },
      {
        id: 'review-confirm',
        title: 'Review & Confirm',
        description: 'Review all settings and create your league',
        component: 'ReviewConfirmStep',
        isComplete: false
      }
    ];
  }

  /**
   * Get current step information
   */
  getCurrentStep(): LeagueConfigurationStep {
    return this.steps[this.currentStep];
  }

  /**
   * Get all steps
   */
  getAllSteps(): LeagueConfigurationStep[] {
    return this.steps;
  }

  /**
   * Move to next step
   */
  nextStep(): boolean {
    if (this.currentStep < this.steps.length - 1) {
      this.steps[this.currentStep].isComplete = true;
      this.currentStep++;
      return true;
    }
    return false;
  }

  /**
   * Move to previous step
   */
  previousStep(): boolean {
    if (this.currentStep > 0) {
      this.currentStep--;
      return true;
    }
    return false;
  }

  /**
   * Jump to specific step
   */
  goToStep(stepId: string): boolean {
    const stepIndex = this.steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      this.currentStep = stepIndex;
      return true;
    }
    return false;
  }

  /**
   * Update step data
   */
  updateStepData(stepId: string, data: any): void {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.data = { ...step.data, ...data };
      this.updateLeagueSettings(stepId, data);
    }
  }

  /**
   * Update league settings based on step data
   */
  private updateLeagueSettings(stepId: string, data: any): void {
    switch (stepId) {
      case 'basic-info':
        this.leagueSettings = {
          ...this.leagueSettings,
          leagueSize: data.leagueSize,
          ...data
        };
        break;
      
      case 'scoring-system':
        this.leagueSettings.scoringSystem = data as ScoringRules;
        break;
      
      case 'roster-positions':
        this.leagueSettings.rosterPositions = data as RosterRequirements;
        break;
      
      case 'league-rules':
        this.leagueSettings = {
          ...this.leagueSettings,
          tradeDeadline: new Date(data.tradeDeadline),
          playoffWeeks: data.playoffWeeks,
          waiverSystem: data.waiverSystem,
          faabBudget: data.faabBudget,
          maxTransactions: data.maxTransactions
        };
        break;
    }
  }

  /**
   * Get current league settings
   */
  getLeagueSettings(): Partial<LeagueSettings> {
    return this.leagueSettings;
  }

  /**
   * Validate current step
   */
  validateCurrentStep(): { isValid: boolean; errors: string[] } {
    const currentStep = this.getCurrentStep();
    const errors: string[] = [];

    switch (currentStep.id) {
      case 'basic-info':
        if (!currentStep.data?.leagueName) {
          errors.push('League name is required');
        }
        if (!currentStep.data?.leagueSize || currentStep.data.leagueSize < 4 || currentStep.data.leagueSize > 20) {
          errors.push('League size must be between 4 and 20 teams');
        }
        break;

      case 'scoring-system':
        if (!currentStep.data?.passing?.touchdowns) {
          errors.push('Passing touchdown points are required');
        }
        if (!currentStep.data?.rushing?.touchdowns) {
          errors.push('Rushing touchdown points are required');
        }
        if (!currentStep.data?.receiving?.touchdowns) {
          errors.push('Receiving touchdown points are required');
        }
        break;

      case 'roster-positions':
        const positions = currentStep.data;
        if (!positions?.QB || positions.QB < 0) {
          errors.push('QB position count is required');
        }
        if (!positions?.RB || positions.RB < 1) {
          errors.push('At least 1 RB position is required');
        }
        if (!positions?.WR || positions.WR < 1) {
          errors.push('At least 1 WR position is required');
        }
        break;

      case 'league-rules':
        if (!currentStep.data?.tradeDeadline) {
          errors.push('Trade deadline is required');
        }
        if (!currentStep.data?.playoffWeeks || currentStep.data.playoffWeeks.length === 0) {
          errors.push('Playoff weeks must be specified');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Import league settings from external platform
   */
  async importFromPlatform(importData: LeagueImportData): Promise<{
    success: boolean;
    settings?: Partial<LeagueSettings>;
    error?: string;
  }> {
    try {
      console.log(`Importing league from ${importData.platform}...`);

      // This would integrate with actual platform APIs
      const importedSettings = await this.fetchLeagueSettings(importData);
      
      if (importedSettings) {
        this.leagueSettings = { ...this.leagueSettings, ...importedSettings };
        
        // Mark relevant steps as complete
        this.markStepsComplete(['basic-info', 'scoring-system', 'roster-positions', 'league-rules']);
        
        return {
          success: true,
          settings: importedSettings
        };
      }

      return {
        success: false,
        error: 'Failed to import league settings'
      };
    } catch (error) {
      console.error('Error importing league:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch league settings from external platform
   */
  private async fetchLeagueSettings(importData: LeagueImportData): Promise<Partial<LeagueSettings> | null> {
    // Mock implementation - would integrate with actual APIs
    switch (importData.platform) {
      case 'ESPN':
        return this.fetchESPNSettings(importData);
      case 'Yahoo':
        return this.fetchYahooSettings(importData);
      case 'Sleeper':
        return this.fetchSleeperSettings(importData);
      case 'NFL':
        return this.fetchNFLSettings(importData);
      default:
        return null;
    }
  }

  /**
   * Fetch ESPN league settings
   */
  private async fetchESPNSettings(importData: LeagueImportData): Promise<Partial<LeagueSettings>> {
    // Mock ESPN API integration
    return {
      leagueSize: 12,
      scoringSystem: {
        passing: { yards: 0.04, touchdowns: 4, interceptions: -2 },
        rushing: { yards: 0.1, touchdowns: 6 },
        receiving: { yards: 0.1, touchdowns: 6, receptions: 1 },
        kicking: { fieldGoals: { '0-39': 3, '40-49': 4, '50+': 5 }, extraPoints: 1 },
        defense: { 
          sacks: 1, 
          interceptions: 2, 
          fumbleRecoveries: 2, 
          touchdowns: 6, 
          safeties: 2,
          pointsAllowed: { '0': 10, '1-6': 7, '7-13': 4, '14-20': 1, '21-27': 0, '28-34': -1, '35+': -4 }
        }
      },
      rosterPositions: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1, BENCH: 6 },
      waiverSystem: 'FAAB',
      faabBudget: 100,
      playoffWeeks: [15, 16, 17],
      tradeDeadline: new Date('2024-11-15')
    };
  }

  /**
   * Fetch Yahoo league settings
   */
  private async fetchYahooSettings(importData: LeagueImportData): Promise<Partial<LeagueSettings>> {
    // Mock Yahoo API integration
    return {
      leagueSize: 10,
      scoringSystem: {
        passing: { yards: 0.04, touchdowns: 6, interceptions: -2 },
        rushing: { yards: 0.1, touchdowns: 6 },
        receiving: { yards: 0.1, touchdowns: 6, receptions: 0.5 },
        kicking: { fieldGoals: { '0-39': 3, '40-49': 4, '50+': 5 }, extraPoints: 1 },
        defense: { 
          sacks: 1, 
          interceptions: 2, 
          fumbleRecoveries: 2, 
          touchdowns: 6, 
          safeties: 2,
          pointsAllowed: { '0': 10, '1-6': 7, '7-13': 4, '14-20': 1, '21-27': 0, '28-34': -1, '35+': -4 }
        }
      },
      rosterPositions: { QB: 1, RB: 2, WR: 3, TE: 1, K: 1, DEF: 1, BENCH: 6 },
      waiverSystem: 'Rolling',
      playoffWeeks: [14, 15, 16],
      tradeDeadline: new Date('2024-11-20')
    };
  }

  /**
   * Fetch Sleeper league settings
   */
  private async fetchSleeperSettings(importData: LeagueImportData): Promise<Partial<LeagueSettings>> {
    // Mock Sleeper API integration
    return {
      leagueSize: 12,
      scoringSystem: {
        passing: { yards: 0.04, touchdowns: 4, interceptions: -2 },
        rushing: { yards: 0.1, touchdowns: 6 },
        receiving: { yards: 0.1, touchdowns: 6, receptions: 1 },
        kicking: { fieldGoals: { '0-39': 3, '40-49': 4, '50+': 5 }, extraPoints: 1 },
        defense: { 
          sacks: 1, 
          interceptions: 2, 
          fumbleRecoveries: 2, 
          touchdowns: 6, 
          safeties: 2,
          pointsAllowed: { '0': 10, '1-6': 7, '7-13': 4, '14-20': 1, '21-27': 0, '28-34': -1, '35+': -4 }
        }
      },
      rosterPositions: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, K: 1, DEF: 1, BENCH: 6 },
      waiverSystem: 'FAAB',
      faabBudget: 100,
      playoffWeeks: [15, 16, 17],
      tradeDeadline: new Date('2024-11-12')
    };
  }

  /**
   * Fetch NFL.com league settings
   */
  private async fetchNFLSettings(importData: LeagueImportData): Promise<Partial<LeagueSettings>> {
    // Mock NFL.com API integration
    return {
      leagueSize: 10,
      scoringSystem: {
        passing: { yards: 0.04, touchdowns: 4, interceptions: -2 },
        rushing: { yards: 0.1, touchdowns: 6 },
        receiving: { yards: 0.1, touchdowns: 6, receptions: 0 },
        kicking: { fieldGoals: { '0-39': 3, '40-49': 4, '50+': 5 }, extraPoints: 1 },
        defense: { 
          sacks: 1, 
          interceptions: 2, 
          fumbleRecoveries: 2, 
          touchdowns: 6, 
          safeties: 2,
          pointsAllowed: { '0': 10, '1-6': 7, '7-13': 4, '14-20': 1, '21-27': 0, '28-34': -1, '35+': -4 }
        }
      },
      rosterPositions: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1, BENCH: 6 },
      waiverSystem: 'Reverse',
      playoffWeeks: [14, 15, 16],
      tradeDeadline: new Date('2024-11-18')
    };
  }

  /**
   * Mark multiple steps as complete
   */
  private markStepsComplete(stepIds: string[]): void {
    stepIds.forEach(stepId => {
      const step = this.steps.find(s => s.id === stepId);
      if (step) {
        step.isComplete = true;
      }
    });
  }

  /**
   * Generate default scoring system
   */
  generateDefaultScoringSystem(type: 'standard' | 'ppr' | 'half-ppr' | 'superflex'): ScoringRules {
    const baseScoring: ScoringRules = {
      passing: { yards: 0.04, touchdowns: 4, interceptions: -2 },
      rushing: { yards: 0.1, touchdowns: 6 },
      receiving: { yards: 0.1, touchdowns: 6, receptions: 0 },
      kicking: { 
        fieldGoals: { '0-39': 3, '40-49': 4, '50+': 5 }, 
        extraPoints: 1 
      },
      defense: { 
        sacks: 1, 
        interceptions: 2, 
        fumbleRecoveries: 2, 
        touchdowns: 6, 
        safeties: 2,
        pointsAllowed: { 
          '0': 10, 
          '1-6': 7, 
          '7-13': 4, 
          '14-20': 1, 
          '21-27': 0, 
          '28-34': -1, 
          '35+': -4 
        }
      }
    };

    switch (type) {
      case 'ppr':
        baseScoring.receiving.receptions = 1;
        break;
      case 'half-ppr':
        baseScoring.receiving.receptions = 0.5;
        break;
      case 'superflex':
        // Superflex doesn't change scoring, just roster positions
        break;
      case 'standard':
      default:
        // Already set to standard
        break;
    }

    return baseScoring;
  }

  /**
   * Generate default roster positions
   */
  generateDefaultRosterPositions(type: 'standard' | 'superflex' | 'dynasty'): RosterRequirements {
    switch (type) {
      case 'superflex':
        return { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, QB: 1, K: 1, DEF: 1, BENCH: 7 };
      case 'dynasty':
        return { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, K: 1, DEF: 1, BENCH: 15, IR: 3 };
      case 'standard':
      default:
        return { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1, BENCH: 6 };
    }
  }

  /**
   * Export league settings for saving
   */
  exportSettings(): LeagueSettings {
    const settings = this.leagueSettings as LeagueSettings;
    
    // Ensure all required fields are present
    if (!settings.leagueSize) settings.leagueSize = 12;
    if (!settings.scoringSystem) settings.scoringSystem = this.generateDefaultScoringSystem('standard');
    if (!settings.rosterPositions) settings.rosterPositions = this.generateDefaultRosterPositions('standard');
    if (!settings.waiverSystem) settings.waiverSystem = 'FAAB';
    if (!settings.playoffWeeks) settings.playoffWeeks = [15, 16, 17];
    if (!settings.tradeDeadline) settings.tradeDeadline = new Date('2024-11-15');

    return settings;
  }

  /**
   * Reset wizard to initial state
   */
  reset(): void {
    this.currentStep = 0;
    this.leagueSettings = {};
    this.steps.forEach(step => {
      step.isComplete = false;
      step.data = undefined;
    });
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage(): number {
    const completedSteps = this.steps.filter(step => step.isComplete).length;
    return Math.round((completedSteps / this.steps.length) * 100);
  }
}
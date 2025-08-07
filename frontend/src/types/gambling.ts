export interface GamblingSession {
  sessionId: string;
  startTime: string;
  duration: number; // in minutes
  activityCount: number;
  lastActivity: string;
}

export interface GamblingAlert {
  id: string;
  type: 'TIME_LIMIT' | 'ACTIVITY_LIMIT' | 'SPENDING_LIMIT' | 'BREAK_REMINDER';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface GamblingLimits {
  sessionTimeLimit: number; // in minutes
  dailyActivityLimit: number;
  breakReminderInterval: number; // in minutes
  enabled: boolean;
}

export interface ResponsibleGamblingConfig {
  limits: GamblingLimits;
  showEducationalContent: boolean;
  trackingEnabled: boolean;
  alertsEnabled: boolean;
}

export interface EducationalContent {
  id: string;
  title: string;
  content: string;
  type: 'TIP' | 'WARNING' | 'RESOURCE';
  url?: string;
}
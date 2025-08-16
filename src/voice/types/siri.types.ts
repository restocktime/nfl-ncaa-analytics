/**
 * Apple Siri specific types and interfaces
 */

export interface SiriRequest {
  intentName: string;
  parameters: Record<string, any>;
  userInfo: SiriUserInfo;
  deviceInfo: SiriDeviceInfo;
  sessionId: string;
  requestId: string;
  timestamp: Date;
}

export interface SiriUserInfo {
  userId: string;
  locale: string;
  voiceIdentifier?: string;
  isAuthenticated: boolean;
}

export interface SiriDeviceInfo {
  deviceId: string;
  deviceType: 'iPhone' | 'iPad' | 'Mac' | 'AppleWatch' | 'HomePod' | 'AppleTV';
  osVersion: string;
  capabilities: SiriCapability[];
}

export enum SiriCapability {
  VOICE_INPUT = 'voice_input',
  DISPLAY_OUTPUT = 'display_output',
  AUDIO_OUTPUT = 'audio_output',
  HAPTIC_FEEDBACK = 'haptic_feedback'
}

export interface SiriResponse {
  responseCode: SiriResponseCode;
  userActivity?: SiriUserActivity;
  response?: SiriIntentResponse;
  error?: SiriError;
}

export enum SiriResponseCode {
  SUCCESS = 'success',
  FAILURE = 'failure',
  FAILURE_REQUIRING_APP_LAUNCH = 'failureRequiringAppLaunch',
  IN_PROGRESS = 'inProgress',
  READY = 'ready',
  CONTINUE_IN_APP = 'continueInApp'
}

export interface SiriUserActivity {
  activityType: string;
  title: string;
  userInfo: Record<string, any>;
  requiredUserInfoKeys?: string[];
  keywords?: string[];
  isEligibleForSearch: boolean;
  isEligibleForPrediction: boolean;
}

export interface SiriIntentResponse {
  spokenResponse?: string;
  displayResponse?: string;
  openAppWhenRun?: boolean;
  userActivity?: SiriUserActivity;
}

export interface SiriError {
  code: string;
  localizedDescription: string;
  localizedFailureReason?: string;
  localizedRecoverySuggestion?: string;
}

export interface SiriIntent {
  identifier: string;
  title: string;
  description: string;
  categoryName: string;
  parameters: SiriIntentParameter[];
  shortcuts: SiriShortcut[];
}

export interface SiriIntentParameter {
  name: string;
  title: string;
  type: SiriParameterType;
  required: boolean;
  configurable: boolean;
  supportedValues?: string[];
}

export enum SiriParameterType {
  STRING = 'string',
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  BOOLEAN = 'boolean',
  DATE = 'date',
  PLAYER = 'player',
  POSITION = 'position',
  TEAM = 'team'
}

export interface SiriShortcut {
  identifier: string;
  phrase: string;
  title: string;
  subtitle?: string;
  userInfo: Record<string, any>;
  isEligibleForSearch: boolean;
  isEligibleForPrediction: boolean;
  suggestedInvocationPhrase?: string;
}

export interface SiriVoiceShortcut {
  shortcut: SiriShortcut;
  invocationPhrase: string;
  identifier: string;
}

export interface SiriIntentDefinition {
  className: string;
  title: string;
  description: string;
  category: SiriIntentCategory;
  parameters: Array<{
    name: string;
    title: string;
    type: string;
    required: boolean;
  }>;
  phrases: string[];
}

export enum SiriIntentCategory {
  INFORMATION = 'information',
  GENERIC = 'generic',
  PLAY = 'play',
  SEARCH = 'search',
  CREATE = 'create',
  UPDATE = 'update'
}

export interface SiriIntentsDefinition {
  intents: SiriIntentDefinition[];
  types: Array<{
    name: string;
    displayName: string;
    values: Array<{
      name: string;
      displayName: string;
      synonyms?: string[];
    }>;
  }>;
}

export interface SiriAppIntentConfiguration {
  bundleIdentifier: string;
  supportedIntents: string[];
  supportedMediaCategories?: string[];
  supportsBackgroundExecution: boolean;
  requiresUserConfirmation: boolean;
}
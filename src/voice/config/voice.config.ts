/**
 * Voice Assistant Configuration
 */

export interface VoiceConfig {
  platforms: {
    alexa: AlexaConfig;
    google: GoogleConfig;
    siri: SiriConfig;
  };
  nlp: NLPConfig;
  general: GeneralVoiceConfig;
}

export interface AlexaConfig {
  enabled: boolean;
  skillId: string;
  applicationId: string;
  verificationCertificateUrl?: string;
  requestSignatureVerification: boolean;
  endpoint: string;
}

export interface GoogleConfig {
  enabled: boolean;
  projectId: string;
  serviceAccountKeyPath?: string;
  webhookUrl: string;
  verifyRequestSignature: boolean;
}

export interface SiriConfig {
  enabled: boolean;
  bundleIdentifier: string;
  appGroupIdentifier: string;
  webhookUrl: string;
  requiresAuthentication: boolean;
}

export interface NLPConfig {
  confidenceThreshold: number;
  entityExtractionEnabled: boolean;
  contextWindowSize: number;
  maxConversationTurns: number;
}

export interface GeneralVoiceConfig {
  sessionTimeoutMinutes: number;
  maxResponseLength: number;
  enableAnalytics: boolean;
  logVoiceInteractions: boolean;
  defaultVerbosity: 'brief' | 'detailed' | 'comprehensive';
}

export const defaultVoiceConfig: VoiceConfig = {
  platforms: {
    alexa: {
      enabled: process.env.ALEXA_ENABLED === 'true',
      skillId: process.env.ALEXA_SKILL_ID || '',
      applicationId: process.env.ALEXA_APPLICATION_ID || '',
      requestSignatureVerification: process.env.NODE_ENV === 'production',
      endpoint: process.env.ALEXA_ENDPOINT || '/api/voice/alexa'
    },
    google: {
      enabled: process.env.GOOGLE_ASSISTANT_ENABLED === 'true',
      projectId: process.env.GOOGLE_PROJECT_ID || '',
      serviceAccountKeyPath: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
      webhookUrl: process.env.GOOGLE_WEBHOOK_URL || '/api/voice/google',
      verifyRequestSignature: process.env.NODE_ENV === 'production'
    },
    siri: {
      enabled: process.env.SIRI_ENABLED === 'true',
      bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER || '',
      appGroupIdentifier: process.env.IOS_APP_GROUP_IDENTIFIER || '',
      webhookUrl: process.env.SIRI_WEBHOOK_URL || '/api/voice/siri',
      requiresAuthentication: true
    }
  },
  nlp: {
    confidenceThreshold: 0.7,
    entityExtractionEnabled: true,
    contextWindowSize: 5,
    maxConversationTurns: 20
  },
  general: {
    sessionTimeoutMinutes: 30,
    maxResponseLength: 8000, // SSML character limit for most platforms
    enableAnalytics: true,
    logVoiceInteractions: process.env.NODE_ENV !== 'production',
    defaultVerbosity: 'detailed'
  }
};

/**
 * Get voice configuration with environment overrides
 */
export function getVoiceConfig(): VoiceConfig {
  return defaultVoiceConfig;
}

/**
 * Validate voice configuration
 */
export function validateVoiceConfig(config: VoiceConfig): string[] {
  const errors: string[] = [];

  // Validate platform configurations
  if (config.platforms.alexa.enabled && !config.platforms.alexa.skillId) {
    errors.push('Alexa Skill ID is required when Alexa is enabled');
  }

  if (config.platforms.google.enabled && !config.platforms.google.projectId) {
    errors.push('Google Project ID is required when Google Assistant is enabled');
  }

  if (config.platforms.siri.enabled && !config.platforms.siri.bundleIdentifier) {
    errors.push('iOS Bundle Identifier is required when Siri is enabled');
  }

  // Validate NLP configuration
  if (config.nlp.confidenceThreshold < 0 || config.nlp.confidenceThreshold > 1) {
    errors.push('NLP confidence threshold must be between 0 and 1');
  }

  if (config.nlp.maxConversationTurns < 1) {
    errors.push('Max conversation turns must be at least 1');
  }

  // Validate general configuration
  if (config.general.sessionTimeoutMinutes < 1) {
    errors.push('Session timeout must be at least 1 minute');
  }

  if (config.general.maxResponseLength < 100) {
    errors.push('Max response length must be at least 100 characters');
  }

  return errors;
}
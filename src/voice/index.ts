/**
 * Voice Assistant Integration Module
 * 
 * This module provides voice assistant capabilities for the fantasy football platform,
 * enabling users to interact with their teams through natural voice commands across
 * multiple platforms (Alexa, Google Assistant, Siri).
 */

// Core Services
export { VoiceGatewayService } from './services/voice-gateway.service';
export { NLPEngineService } from './nlp/nlp-engine.service';
export { IntentRecognitionService } from './services/intent-recognition.service';
export { ContextManagerService } from './services/context-manager.service';

// Platform Adapters
export { AlexaAdapterService } from './adapters/alexa-adapter.service';
export { GoogleAdapterService } from './adapters/google-adapter.service';
export { SiriAdapterService } from './adapters/siri-adapter.service';

// Core Types
export * from './types/voice.types';
export * from './types/alexa.types';
export * from './types/google.types';
export * from './types/siri.types';

// Re-export commonly used types for convenience
export type {
  VoiceRequest,
  VoiceResponse,
  VoiceIntentType,
  VoicePlatform,
  ConversationContext,
  Intent,
  EntityMap
} from './types/voice.types';
import { Player } from '../../models/Player';

// Core voice interaction types
export interface VoiceInput {
  text: string;
  platform: VoicePlatform;
  sessionId: string;
  userId?: string;
  context?: ConversationContext;
}

export interface ParsedIntent {
  intent: Intent;
  entities: ResolvedEntities;
  confidence: number;
  originalText: string;
  normalizedText: string;
  requiresConfirmation: boolean;
  multiStep: boolean;
}

export interface Intent {
  name: string;
  confidence: number;
  requiresConfirmation: boolean;
  multiStep: boolean;
}

export interface VoiceIntent extends Intent {
  entities: EntityMap;
}

// Entity types
export interface EntityMap {
  players?: string[];
  position?: string;
  week?: number;
  team?: string;
  number?: number;
  [key: string]: any;
}

export interface ResolvedEntities extends EntityMap {
  players?: string[];
  position?: string;
  week?: number;
  team?: string;
  number?: number;
}

// Conversation context types
export interface ConversationContext {
  sessionId: string;
  userId: string;
  currentLeague: string;
  conversationTopic: ConversationTopic | null;
  pendingActions: PendingAction[];
  entityContext: EntityContext;
  lastInteraction: Date;
  currentWeek?: number;
  userTeam?: string[];
  recentPlayers?: string[];
  lastPosition?: string | null;
  conversationHistory?: ConversationTurn[];
}

export interface ContextUpdate {
  userId?: string;
  currentLeague?: string;
  conversationTopic?: ConversationTopic | null;
  pendingActions?: PendingAction[];
  entityContext?: EntityContext;
  currentWeek?: number;
  userTeam?: string[];
  recentPlayers?: string[];
  lastPosition?: string | null;
  conversationHistory?: ConversationTurn[];
}

export interface EntityContext {
  [key: string]: any;
}

export interface ConversationTurn {
  timestamp: Date;
  userInput: string;
  intent: string;
  entities: EntityMap;
  response: string;
}

export type ConversationTopic = 'lineup' | 'waiver' | 'trade' | 'projections' | 'matchup' | 'team_status';

// Action types
export interface PendingAction {
  type: string;
  data: any;
  timestamp: Date;
  requiresConfirmation: boolean;
}

// Conversation flow types
export interface ConversationFlow {
  currentStep: number;
  totalSteps: number;
  nextAction: 'complete' | 'confirm' | 'clarify' | 'analyze' | 'recommend';
  requiresInput: boolean;
  contextUpdates: Partial<ContextUpdate>;
  followUpSuggestions: string[];
}

// Voice platform types
export type VoicePlatform = 'alexa' | 'google' | 'siri' | 'generic';

export interface VoicePlatformConnection {
  platform: VoicePlatform;
  platformUserId: string;
  isLinked: boolean;
  permissions: VoicePermission[];
  lastUsed: Date;
}

export type VoicePermission = 'read_team' | 'modify_lineup' | 'access_projections' | 'manage_waiver' | 'analyze_trades';

// Voice user profile
export interface VoiceUserProfile {
  userId: string;
  voicePlatforms: VoicePlatformConnection[];
  voicePreferences: VoicePreferences;
  conversationHistory: ConversationSession[];
  quickAccessLeague: string;
}

export interface VoicePreferences {
  preferredVoice?: string;
  speechRate?: number;
  verbosityLevel: 'brief' | 'normal' | 'detailed';
  confirmationRequired: boolean;
  proactiveNotifications: boolean;
}

export interface ConversationSession {
  sessionId: string;
  platform: VoicePlatform;
  startTime: Date;
  endTime?: Date;
  turnCount: number;
  topics: ConversationTopic[];
}

// Response types
export interface VoiceResponse {
  text: string;
  ssml?: string;
  shouldEndSession: boolean;
  reprompt?: string;
  cardData?: CardData;
  followUpSuggestions?: string[];
}

export interface CardData {
  title: string;
  content: string;
  imageUrl?: string;
}

// Platform-specific request/response types
export interface AlexaRequest {
  type: string;
  requestId: string;
  timestamp: string;
  locale: string;
  intent?: {
    name: string;
    slots?: { [key: string]: { value: string } };
  };
  session: {
    sessionId: string;
    user: { userId: string };
  };
}

export interface AlexaResponse {
  version: string;
  response: {
    outputSpeech: {
      type: 'PlainText' | 'SSML';
      text?: string;
      ssml?: string;
    };
    card?: {
      type: 'Simple';
      title: string;
      content: string;
    };
    reprompt?: {
      outputSpeech: {
        type: 'PlainText' | 'SSML';
        text?: string;
        ssml?: string;
      };
    };
    shouldEndSession: boolean;
  };
}

export interface GoogleRequest {
  queryResult: {
    queryText: string;
    intent: {
      displayName: string;
    };
    parameters: { [key: string]: any };
  };
  session: string;
}

export interface GoogleResponse {
  fulfillmentText: string;
  fulfillmentMessages?: Array<{
    text?: { text: string[] };
    quickReplies?: { quickReplies: string[] };
  }>;
}

export interface SiriRequest {
  intent: string;
  parameters: { [key: string]: any };
  sessionId: string;
}

export interface SiriResponse {
  response: string;
  userActivity?: any;
}

// Error types
export interface VoiceError {
  type: 'speech_recognition' | 'intent_classification' | 'entity_extraction' | 'service_unavailable' | 'ambiguous_input';
  message: string;
  context?: any;
  suggestions?: string[];
}

// NLP Engine interfaces
export interface NLPEngine {
  processVoiceInput(input: VoiceInput): Promise<ParsedIntent>;
  extractEntities(text: string): Promise<EntityMap>;
  classifyIntent(text: string, context?: ConversationContext): Promise<Intent>;
  resolveAmbiguity(entities: EntityMap, context?: ConversationContext): Promise<ResolvedEntities>;
}

// Context Manager interfaces
export interface ContextManager {
  getConversationContext(sessionId: string): Promise<ConversationContext>;
  updateContext(sessionId: string, update: ContextUpdate): Promise<void>;
  resolvePlayerReference(playerRef: string, context: ConversationContext): Promise<Player | null>;
  maintainConversationFlow(intent: VoiceIntent, context: ConversationContext): Promise<ConversationFlow>;
}

// Fantasy Voice Service types
export interface VoiceTeamSummary {
  projectedPoints: number;
  activePlayerCount: number;
  inactivePlayerCount: number;
  keyMatchups: string[];
  recommendations: string[];
}

export interface VoiceLineupChange {
  action: 'start' | 'bench' | 'drop' | 'add';
  playerId: string;
  position?: string;
  reason?: string;
}

export interface VoiceLineupResult {
  success: boolean;
  message: string;
  updatedLineup?: any;
  warnings?: string[];
}

export interface VoicePlayerAnalysis {
  playerId: string;
  playerName: string;
  projectedPoints: number;
  matchupRating: 'excellent' | 'good' | 'average' | 'poor';
  injuryStatus: string;
  recommendation: 'start' | 'bench' | 'consider' | 'avoid';
  reasoning: string[];
}

export interface VoiceWaiverRecommendations {
  topTargets: Array<{
    playerId: string;
    playerName: string;
    position: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
  }>;
  droppablePlayers: Array<{
    playerId: string;
    playerName: string;
    reasoning: string;
  }>;
}

export interface VoiceTradeProposal {
  givingPlayers: string[];
  receivingPlayers: string[];
  context?: string;
}

export interface VoiceTradeAnalysis {
  recommendation: 'accept' | 'decline' | 'counter';
  confidence: number;
  reasoning: string[];
  alternativeOffers?: Array<{
    give: string[];
    receive: string[];
    reasoning: string;
  }>;
}
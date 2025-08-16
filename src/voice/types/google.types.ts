/**
 * Google Assistant specific types and interfaces
 */

export interface GoogleRequest {
  responseId: string;
  queryResult: GoogleQueryResult;
  originalDetectIntentRequest: GoogleOriginalRequest;
  session: string;
}

export interface GoogleQueryResult {
  queryText: string;
  languageCode: string;
  speechRecognitionConfidence: number;
  action: string;
  parameters: Record<string, any>;
  allRequiredParamsPresent: boolean;
  fulfillmentText: string;
  fulfillmentMessages: GoogleFulfillmentMessage[];
  outputContexts: GoogleContext[];
  intent: GoogleIntent;
  intentDetectionConfidence: number;
}

export interface GoogleOriginalRequest {
  source: string;
  version: string;
  payload: {
    isInSandbox: boolean;
    surface: {
      capabilities: Array<{
        name: string;
      }>;
    };
    inputs: GoogleInput[];
    user: {
      userStorage?: string;
      lastSeen?: string;
      locale: string;
      userId: string;
    };
    conversation: GoogleConversation;
    availableSurfaces: Array<{
      capabilities: Array<{
        name: string;
      }>;
    }>;
  };
}

export interface GoogleInput {
  rawInputs: Array<{
    query: string;
    inputType: 'KEYBOARD' | 'VOICE';
  }>;
  intent: string;
  arguments?: Array<{
    name: string;
    rawText: string;
    textValue: string;
  }>;
}

export interface GoogleConversation {
  conversationId: string;
  type: 'NEW' | 'ACTIVE';
  conversationToken?: string;
}

export interface GoogleContext {
  name: string;
  lifespanCount: number;
  parameters: Record<string, any>;
}

export interface GoogleIntent {
  name: string;
  displayName: string;
}

export interface GoogleFulfillmentMessage {
  text?: {
    text: string[];
  };
  quickReplies?: {
    title: string;
    quickReplies: string[];
  };
  card?: {
    title: string;
    subtitle: string;
    imageUri: string;
    buttons: Array<{
      text: string;
      postback: string;
    }>;
  };
  payload?: Record<string, any>;
  platform?: string;
}

export interface GoogleResponse {
  fulfillmentText: string;
  fulfillmentMessages?: GoogleFulfillmentMessage[];
  source?: string;
  payload?: GoogleResponsePayload;
  outputContexts?: GoogleContext[];
  followupEventInput?: {
    name: string;
    languageCode: string;
    parameters: Record<string, any>;
  };
}

export interface GoogleResponsePayload {
  google: {
    expectUserResponse: boolean;
    richResponse: {
      items: GoogleRichResponseItem[];
      suggestions?: Array<{
        title: string;
      }>;
      linkOutSuggestion?: {
        destinationName: string;
        url: string;
      };
    };
    systemIntent?: {
      intent: string;
      data: Record<string, any>;
    };
    userStorage?: string;
  };
}

export interface GoogleRichResponseItem {
  simpleResponse?: {
    textToSpeech: string;
    ssml?: string;
    displayText?: string;
  };
  basicCard?: {
    title: string;
    subtitle?: string;
    formattedText: string;
    image?: {
      url: string;
      accessibilityText: string;
    };
    buttons?: Array<{
      title: string;
      openUrlAction: {
        url: string;
      };
    }>;
  };
  mediaResponse?: {
    mediaType: 'AUDIO';
    mediaObjects: Array<{
      name: string;
      description: string;
      contentUrl: string;
      largeImage?: {
        url: string;
        accessibilityText: string;
      };
    }>;
  };
}

export interface GoogleActionManifest {
  actions: GoogleActionDefinition[];
  conversations: Record<string, GoogleConversationDefinition>;
  locale: string;
}

export interface GoogleActionDefinition {
  description: string;
  name: string;
  fulfillment: {
    conversationName: string;
  };
  intent: {
    name: string;
    parameters?: Array<{
      name: string;
      type: string;
    }>;
    trigger: {
      queryPatterns: string[];
    };
  };
}

export interface GoogleConversationDefinition {
  name: string;
  url: string;
  fulfillmentApiVersion: number;
}
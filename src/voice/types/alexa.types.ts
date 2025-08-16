/**
 * Amazon Alexa specific types and interfaces
 */

export interface AlexaRequest {
  version: string;
  session: AlexaSession;
  context: AlexaContext;
  request: AlexaRequestBody;
}

export interface AlexaSession {
  sessionId: string;
  application: {
    applicationId: string;
  };
  user: {
    userId: string;
    accessToken?: string;
  };
  attributes?: Record<string, any>;
  new: boolean;
}

export interface AlexaContext {
  System: {
    application: {
      applicationId: string;
    };
    user: {
      userId: string;
      accessToken?: string;
    };
    device: {
      deviceId: string;
      supportedInterfaces: Record<string, any>;
    };
    apiEndpoint: string;
    apiAccessToken: string;
  };
}

export interface AlexaRequestBody {
  type: 'LaunchRequest' | 'IntentRequest' | 'SessionEndedRequest';
  requestId: string;
  timestamp: string;
  locale: string;
  intent?: AlexaIntent;
  reason?: string;
}

export interface AlexaIntent {
  name: string;
  confirmationStatus: 'NONE' | 'CONFIRMED' | 'DENIED';
  slots?: Record<string, AlexaSlot>;
}

export interface AlexaSlot {
  name: string;
  value?: string;
  confirmationStatus: 'NONE' | 'CONFIRMED' | 'DENIED';
  resolutions?: {
    resolutionsPerAuthority: AlexaResolution[];
  };
}

export interface AlexaResolution {
  authority: string;
  status: {
    code: 'ER_SUCCESS_MATCH' | 'ER_SUCCESS_NO_MATCH' | 'ER_ERROR_TIMEOUT' | 'ER_ERROR_EXCEPTION';
  };
  values?: Array<{
    value: {
      name: string;
      id: string;
    };
  }>;
}

export interface AlexaResponse {
  version: string;
  sessionAttributes?: Record<string, any>;
  response: AlexaResponseBody;
}

export interface AlexaResponseBody {
  outputSpeech?: AlexaOutputSpeech;
  card?: AlexaCard;
  reprompt?: {
    outputSpeech: AlexaOutputSpeech;
  };
  shouldEndSession: boolean;
  directives?: AlexaDirective[];
}

export interface AlexaOutputSpeech {
  type: 'PlainText' | 'SSML';
  text?: string;
  ssml?: string;
}

export interface AlexaCard {
  type: 'Simple' | 'Standard' | 'LinkAccount';
  title?: string;
  content?: string;
  text?: string;
  image?: {
    smallImageUrl?: string;
    largeImageUrl?: string;
  };
}

export interface AlexaDirective {
  type: string;
  [key: string]: any;
}

export interface AlexaSkillManifest {
  manifest: {
    publishingInformation: {
      locales: Record<string, {
        name: string;
        summary: string;
        description: string;
        keywords: string[];
      }>;
      category: string;
      distributionCountries: string[];
    };
    apis: {
      custom: {
        endpoint: {
          uri: string;
        };
        interfaces: Array<{
          type: string;
        }>;
      };
    };
    permissions: Array<{
      name: string;
    }>;
    privacyAndCompliance: {
      allowsPurchases: boolean;
      usesPersonalInfo: boolean;
      isChildDirected: boolean;
      isExportCompliant: boolean;
      containsAds: boolean;
    };
  };
}

export interface AlexaInteractionModel {
  interactionModel: {
    languageModel: {
      invocationName: string;
      intents: AlexaIntentDefinition[];
      types?: AlexaSlotType[];
    };
  };
}

export interface AlexaIntentDefinition {
  name: string;
  slots?: Array<{
    name: string;
    type: string;
    samples?: string[];
  }>;
  samples: string[];
}

export interface AlexaSlotType {
  name: string;
  values: Array<{
    id?: string;
    name: {
      value: string;
      synonyms?: string[];
    };
  }>;
}
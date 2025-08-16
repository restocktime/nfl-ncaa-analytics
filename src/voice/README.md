# Voice Assistant Integration

This module provides voice assistant capabilities for the fantasy football platform, enabling users to interact with their teams through natural voice commands across multiple platforms.

## Architecture

```
src/voice/
├── adapters/           # Platform-specific adapters
│   ├── alexa-adapter.service.ts
│   ├── google-adapter.service.ts
│   └── siri-adapter.service.ts
├── config/             # Configuration files
│   └── voice.config.ts
├── nlp/                # Natural Language Processing
│   └── nlp-engine.service.ts
├── routes/             # API routes for voice webhooks
│   └── voice.routes.ts
├── services/           # Core voice services
│   ├── voice-gateway.service.ts
│   ├── intent-recognition.service.ts
│   └── context-manager.service.ts
├── types/              # TypeScript type definitions
│   ├── voice.types.ts
│   ├── alexa.types.ts
│   ├── google.types.ts
│   └── siri.types.ts
├── index.ts            # Module exports
└── README.md           # This file
```

## Supported Platforms

### Amazon Alexa
- **Skills Kit Integration**: Full Alexa Skills Kit support
- **SSML Support**: Enhanced speech synthesis
- **Account Linking**: OAuth integration for user authentication
- **Cards**: Visual responses for devices with screens

### Google Assistant
- **Actions SDK**: Google Actions integration
- **Conversation Management**: Multi-turn conversation support
- **Suggestion Chips**: Quick reply options
- **Rich Responses**: Cards, images, and media

### Apple Siri
- **Shortcuts Integration**: iOS Shortcuts app support
- **Intent Donations**: Automatic shortcut suggestions
- **App Extensions**: iOS app extension for voice handling
- **Handoff**: Seamless transition to app when needed

## Core Features

### Intent Recognition
- **Team Status**: "How is my team doing this week?"
- **Player Projections**: "How many points will Josh Allen score?"
- **Lineup Management**: "Start Derrick Henry at running back"
- **Waiver Wire**: "Who should I pick up this week?"
- **Trade Analysis**: "Should I trade CMC for Tyreek Hill?"
- **Matchup Analysis**: "Tell me about this week's matchup"

### Natural Language Processing
- **Entity Extraction**: Player names, positions, teams, weeks
- **Context Awareness**: Multi-turn conversation support
- **Ambiguity Resolution**: "Which Johnson do you mean?"
- **Player Name Matching**: Fuzzy matching for player names

### Conversation Management
- **Session Persistence**: Maintain context across interactions
- **Multi-turn Conversations**: Follow-up questions and clarifications
- **Context Switching**: Handle topic changes gracefully
- **Error Recovery**: Graceful handling of misunderstood commands

## Configuration

Voice assistant features can be configured through environment variables:

```bash
# Alexa Configuration
ALEXA_ENABLED=true
ALEXA_SKILL_ID=your_skill_id
ALEXA_APPLICATION_ID=your_app_id

# Google Assistant Configuration
GOOGLE_ASSISTANT_ENABLED=true
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/path/to/key.json

# Siri Configuration
SIRI_ENABLED=true
IOS_BUNDLE_IDENTIFIER=com.yourapp.fantasy
IOS_APP_GROUP_IDENTIFIER=group.com.yourapp.fantasy
```

## API Endpoints

### Voice Platform Webhooks
- `POST /api/voice/alexa` - Alexa Skills Kit webhook
- `POST /api/voice/google` - Google Assistant Actions webhook
- `POST /api/voice/siri` - Siri Shortcuts webhook

### Management Endpoints
- `GET /api/voice/health` - Health check for voice services
- `GET /api/voice/capabilities` - Supported features and intents

## Usage Example

```typescript
import { VoiceGatewayService } from './voice';

const voiceGateway = new VoiceGatewayService();

// Handle Alexa request
const alexaResponse = await voiceGateway.handleAlexaRequest(alexaRequest);

// Handle Google Assistant request
const googleResponse = await voiceGateway.handleGoogleRequest(googleRequest);

// Handle Siri request
const siriResponse = await voiceGateway.handleSiriRequest(siriRequest);
```

## Development Status

This is the initial infrastructure setup for voice assistant integration. The following components are implemented as scaffolding:

✅ **Completed**:
- Directory structure
- TypeScript interfaces and types
- Service class scaffolding
- Platform adapter structure
- Configuration system
- API routing structure

🚧 **To Be Implemented** (in subsequent tasks):
- NLP engine implementation
- Intent recognition logic
- Platform-specific handlers
- Fantasy service integration
- Response generation
- Authentication flows
- Testing suite

## Requirements Addressed

This implementation addresses the following requirements from the specification:

- **6.1**: Amazon Alexa Skills integration structure
- **6.2**: Google Assistant Actions integration structure  
- **6.3**: Apple Siri Shortcuts integration structure
- **6.4**: Cross-platform conversation context management

## Next Steps

1. Implement NLP engine for intent classification and entity extraction
2. Build platform-specific request/response handlers
3. Integrate with existing fantasy football services
4. Implement response generation and templating
5. Add authentication and user management
6. Create comprehensive test suite
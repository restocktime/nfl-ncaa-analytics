# Football Analytics System

A comprehensive real-time football analytics system that provides predictive modeling, live probability calculations, and advanced statistical analysis for both NFL and college football.

## Project Structure

```
src/
├── types/                  # Core type definitions
│   ├── common.types.ts    # Shared types (GameStatus, Position, etc.)
│   ├── game.types.ts      # Game-related interfaces
│   ├── team.types.ts      # Team and coaching staff types
│   ├── player.types.ts    # Player statistics and props
│   └── index.ts           # Type exports
├── core/                  # Core infrastructure
│   ├── base-service.ts    # Base service class with error handling
│   ├── config.ts          # Configuration management
│   └── logger.ts          # Structured logging service
├── container/             # Dependency injection
│   ├── container.ts       # DI container setup
│   └── types.ts           # DI type symbols
├── __tests__/             # Test files
└── index.ts               # Application entry point
```

## Features Implemented

### ✅ Task 1: Project Structure and Core Interfaces

- **TypeScript Project Setup**: Complete microservices architecture foundation
- **Core Interfaces**: Comprehensive type definitions for Game, Team, Player, and GameState entities
- **Dependency Injection**: Inversify-based DI container with proper service registration
- **Configuration Management**: Environment-based configuration with validation
- **Base Service Classes**: Logging, error handling, retry logic, and health checks
- **Testing Framework**: Jest setup with comprehensive test coverage

### Core Components

1. **Type System**: Strongly typed interfaces for all football entities
2. **Configuration Service**: Environment-based configuration with nested key support
3. **Logging Service**: Winston-based structured logging with child loggers
4. **Base Service**: Abstract base class providing common functionality:
   - Error handling and wrapping
   - Retry logic with exponential backoff
   - Health check capabilities
   - Configuration validation
5. **Dependency Injection**: Clean separation of concerns with Inversify

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

### Development

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test:watch
```

### Testing

The project includes comprehensive unit tests:

```bash
npm test
```

Current test coverage includes:
- Configuration management
- Base service functionality
- Error handling and retry logic
- Dependency injection container

## Architecture

The system follows a microservices architecture with:

- **Separation of Concerns**: Each service has a single responsibility
- **Dependency Injection**: Loose coupling between components
- **Error Handling**: Comprehensive error handling with proper logging
- **Configuration Management**: Environment-based configuration
- **Type Safety**: Full TypeScript coverage with strict typing

## Next Steps

This foundation supports the implementation of:
- Data ingestion services
- Probability calculation engines
- Monte Carlo simulation services
- Machine learning model services
- Real-time WebSocket services
- External API integrations

Each service will extend the `BaseService` class and be registered in the DI container for consistent behavior and maintainability.
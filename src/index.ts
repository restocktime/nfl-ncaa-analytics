import 'reflect-metadata';
import { DIContainer } from './container/container';
import { TYPES } from './container/types';
import { Logger } from './core/logger';
import { Config } from './core/config';

/**
 * Main application entry point
 */
class Application {
  private container = DIContainer.getInstance();
  private logger: Logger;
  private config: Config;

  constructor() {
    this.logger = this.container.get<Logger>(TYPES.Logger);
    this.config = this.container.get<Config>(TYPES.Config);
  }

  public async start(): Promise<void> {
    try {
      this.logger.info('Starting Football Analytics System');
      
      const serverConfig = this.config.get<any>('server');
      this.logger.info('Application configuration loaded', {
        environment: serverConfig.environment,
        port: serverConfig.port
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
      this.logger.info('Football Analytics System started successfully');
      
    } catch (error) {
      this.logger.error('Failed to start application', error as Error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}, shutting down gracefully`);
      
      try {
        // Future: Add service shutdown logic here
        this.logger.info('Application shutdown completed');
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during shutdown', error as Error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection', new Error(String(reason)), {
        promise: promise.toString()
      });
    });

    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception', error);
      process.exit(1);
    });
  }
}

// Start the application
if (require.main === module) {
  const app = new Application();
  app.start().catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

export { Application };
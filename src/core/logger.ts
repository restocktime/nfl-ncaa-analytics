import { injectable, inject } from 'inversify';
import * as winston from 'winston';
import { TYPES } from '../container/types';
import { Config } from './config';

/**
 * Centralized logging service with structured logging support
 */
@injectable()
export class Logger {
  private logger!: winston.Logger;

  constructor(@inject(TYPES.Config) private config: Config) {
    this.initializeLogger();
  }

  private initializeLogger(): void {
    const logConfig = this.config.get<any>('logging');
    
    const transports: winston.transport[] = [];

    // Console transport
    if (logConfig.enableConsole) {
      transports.push(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${level}]: ${message} ${metaStr}`;
          })
        )
      }));
    }

    // File transport
    if (logConfig.enableFile) {
      transports.push(new winston.transports.File({
        filename: logConfig.filePath,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }));
    }

    this.logger = winston.createLogger({
      level: logConfig.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports,
      defaultMeta: {
        service: 'football-analytics-system'
      }
    });
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  public error(message: string, error?: Error, meta?: any): void {
    this.logger.error(message, {
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined,
      ...meta
    });
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  public verbose(message: string, meta?: any): void {
    this.logger.verbose(message, meta);
  }

  public createChildLogger(context: string): ChildLogger {
    return new ChildLogger(this.logger, context);
  }
}

/**
 * Child logger with contextual information
 */
export class ChildLogger {
  constructor(
    private parentLogger: winston.Logger,
    private context: string
  ) {}

  public info(message: string, meta?: any): void {
    this.parentLogger.info(message, { context: this.context, ...meta });
  }

  public error(message: string, error?: Error, meta?: any): void {
    this.parentLogger.error(message, {
      context: this.context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined,
      ...meta
    });
  }

  public warn(message: string, meta?: any): void {
    this.parentLogger.warn(message, { context: this.context, ...meta });
  }

  public debug(message: string, meta?: any): void {
    this.parentLogger.debug(message, { context: this.context, ...meta });
  }

  public verbose(message: string, meta?: any): void {
    this.parentLogger.verbose(message, { context: this.context, ...meta });
  }
}
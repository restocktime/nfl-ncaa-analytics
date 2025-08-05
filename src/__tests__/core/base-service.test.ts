import { BaseService, ServiceError, ConfigurationError } from '../../core/base-service';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';

// Mock implementation for testing
class TestService extends BaseService {
  constructor(logger: Logger, config: Config) {
    super(logger, config, 'TestService');
  }

  public async testOperation(): Promise<string> {
    return this.executeWithErrorHandling(
      async () => 'success',
      'testOperation'
    );
  }

  public async testFailingOperation(): Promise<string> {
    return this.executeWithErrorHandling(
      async () => {
        throw new Error('Test error');
      },
      'testFailingOperation'
    );
  }

  public async testRetryOperation(shouldFail: boolean = false): Promise<string> {
    let attempts = 0;
    return this.retryWithBackoff(
      async () => {
        attempts++;
        if (shouldFail && attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return `Success after ${attempts} attempts`;
      },
      3,
      10 // Short delay for testing
    );
  }

  public testValidateConfig(keys: string[]): void {
    this.validateConfig(keys);
  }
}

describe('BaseService', () => {
  let service: TestService;
  let mockLogger: jest.Mocked<Logger>;
  let mockConfig: jest.Mocked<Config>;

  beforeEach(() => {
    mockLogger = {
      createChildLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn()
      })
    } as any;

    mockConfig = {
      has: jest.fn(),
      get: jest.fn(),
      set: jest.fn()
    } as any;

    service = new TestService(mockLogger, mockConfig);
  });

  describe('executeWithErrorHandling', () => {
    it('should execute operation successfully', async () => {
      const result = await service.testOperation();
      expect(result).toBe('success');
    });

    it('should wrap errors in ServiceError', async () => {
      await expect(service.testFailingOperation()).rejects.toThrow(ServiceError);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const result = await service.testRetryOperation(false);
      expect(result).toBe('Success after 1 attempts');
    });

    it('should retry and eventually succeed', async () => {
      const result = await service.testRetryOperation(true);
      expect(result).toBe('Success after 3 attempts');
    });
  });

  describe('validateConfig', () => {
    it('should pass validation when all keys exist', () => {
      mockConfig.has.mockReturnValue(true);
      expect(() => service.testValidateConfig(['key1', 'key2'])).not.toThrow();
    });

    it('should throw ConfigurationError when keys are missing', () => {
      mockConfig.has.mockReturnValue(false);
      expect(() => service.testValidateConfig(['missing.key'])).toThrow(ConfigurationError);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status by default', async () => {
      const result = await service.healthCheck();
      expect(result.status).toBe('healthy');
      expect(result.service).toBe('TestService');
    });
  });
});
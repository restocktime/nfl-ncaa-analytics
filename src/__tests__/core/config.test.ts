import { Config } from '../../core/config';

describe('Config', () => {
  let config: Config;

  beforeEach(() => {
    // Clear environment variables
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    config = new Config();
  });

  describe('get', () => {
    it('should return default server port', () => {
      const port = config.get<number>('server.port');
      expect(port).toBe(3000);
    });

    it('should return default environment', () => {
      const env = config.get<string>('server.environment');
      expect(env).toBe('development');
    });

    it('should throw error for non-existent key', () => {
      expect(() => config.get('non.existent.key')).toThrow();
    });
  });

  describe('set', () => {
    it('should set and retrieve custom value', () => {
      config.set('custom.key', 'test-value');
      const value = config.get<string>('custom.key');
      expect(value).toBe('test-value');
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      expect(config.has('server.port')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(config.has('non.existent.key')).toBe(false);
    });
  });

  describe('environment variables', () => {
    it('should use environment variable when available', () => {
      process.env.PORT = '8080';
      const newConfig = new Config();
      const port = newConfig.get<number>('server.port');
      expect(port).toBe(8080);
    });
  });
});
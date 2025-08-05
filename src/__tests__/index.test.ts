import { Application } from '../index';
import { DIContainer } from '../container/container';

describe('Application', () => {
  let app: Application;

  beforeEach(() => {
    // Reset container for clean test state
    DIContainer.reset();
    app = new Application();
  });

  it('should create application instance', () => {
    expect(app).toBeInstanceOf(Application);
  });

  it('should have access to logger and config through DI container', () => {
    const container = DIContainer.getInstance();
    expect(container).toBeDefined();
    
    // Verify that core services are bound
    expect(() => container.get(Symbol.for('Logger'))).not.toThrow();
    expect(() => container.get(Symbol.for('Config'))).not.toThrow();
  });
});
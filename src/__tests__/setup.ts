// Jest setup file for fantasy football tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Date.now for consistent testing
const mockDate = new Date('2024-11-15T10:00:00Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
Date.now = jest.fn(() => mockDate.getTime());

// Mock Math.random for predictable results
Math.random = jest.fn(() => 0.5);

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
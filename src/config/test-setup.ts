// Test setup configuration
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env['NODE_ENV'] = 'test';

// Mock Prisma Client globally
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => require('../__mocks__/prisma').default),
}));

// Mock bcrypt for consistent testing
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-id', email: 'test@example.com' }),
}));

// Mock console methods to reduce noise in tests (optional)
const originalConsole = global.console;
global.console = {
  ...console,
  log: process.env['JEST_VERBOSE'] === 'true' ? originalConsole.log : jest.fn(),
  debug: process.env['JEST_VERBOSE'] === 'true' ? originalConsole.debug : jest.fn(),
  info: process.env['JEST_VERBOSE'] === 'true' ? originalConsole.info : jest.fn(),
  warn: originalConsole.warn, // Keep warnings
  error: originalConsole.error, // Keep errors
};

// Global test timeout
jest.setTimeout(10000);

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});
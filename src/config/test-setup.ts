// Test setup configuration
import dotenv from 'dotenv';
import { resetDatabaseMocks } from '../__mocks__/test-utils';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env['NODE_ENV'] = 'test';

// Mock Prisma Client globally for unit tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => require('../__mocks__/prisma').default),
}));

// Note: bcrypt and jsonwebtoken mocks are conditionally applied
// They are NOT globally mocked to allow utility tests to test real functionality
// Individual test files can mock these libraries as needed

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
  resetDatabaseMocks();
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Extend Jest matchers for better testing experience
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUser(): R;
      toBeValidAuthResponse(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidUser(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      typeof received.email === 'string' &&
      received.createdAt instanceof Date &&
      received.updatedAt instanceof Date &&
      !received.password; // Password should not be included in responses

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid user object`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid user object`,
        pass: false,
      };
    }
  },

  toBeValidAuthResponse(received) {
    const pass = received &&
      typeof received.token === 'string' &&
      received.user &&
      typeof received.user.id === 'string' &&
      typeof received.user.email === 'string' &&
      !received.user.password; // Password should not be included

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid auth response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid auth response`,
        pass: false,
      };
    }
  },
});
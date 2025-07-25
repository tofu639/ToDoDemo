# Testing Framework Setup

This document outlines the testing framework configuration and utilities that have been implemented for the Node.js TypeScript API demo project.

## Configuration Files

### Jest Configuration (`jest.config.js`)
- **Framework**: Jest with TypeScript support via ts-jest
- **Test Environment**: Node.js
- **Test Pattern**: Matches `**/__tests__/**/*.ts` and `**/?(*.)+(spec|test).ts`
- **Coverage**: 80% threshold for branches, functions, lines, and statements
- **Setup**: Global test setup via `src/config/test-setup.ts`

### Test Environment Configuration (`.env.test`)
- Dedicated test environment variables
- Test database configuration
- Reduced bcrypt rounds for faster testing
- JWT configuration for testing

## Test Utilities and Mocks

### Database Mocking (`src/__mocks__/prisma.ts`)
- Deep mock of PrismaClient using jest-mock-extended
- Provides type-safe mocking for all Prisma operations

### Test Utilities (`src/__mocks__/test-utils.ts`)
- **Mock Data Factories**: `createMockUser()`, `createMockUsers()`
- **Database Mock Helpers**: Functions to mock CRUD operations
- **Test Data**: Pre-defined valid and invalid test data
- **Response Helpers**: Functions to validate API responses
- **Authentication Helpers**: JWT token creation for tests

### Test Database Configuration (`src/config/test-database.ts`)
- Singleton pattern for test database management
- Connection and cleanup utilities
- Data seeding helpers for integration tests

## Global Test Setup (`src/config/test-setup.ts`)

### Environment Configuration
- Loads test environment variables
- Sets NODE_ENV to 'test'

### Global Mocks
- **Prisma Client**: Mocked for unit tests
- **bcrypt**: Consistent hashing for tests
- **jsonwebtoken**: Predictable token generation

### Custom Jest Matchers
- `toBeValidUser()`: Validates user object structure
- `toBeValidAuthResponse()`: Validates authentication response

### Global Test Hooks
- `beforeEach()`: Resets all mocks
- `afterEach()`: Restores mocks

## Test Scripts (package.json)

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

## Coverage Configuration

- **Directory**: `coverage/`
- **Reporters**: text, lcov, html, json
- **Thresholds**: 80% for all metrics
- **Exclusions**: 
  - Type definition files (*.d.ts)
  - Test files themselves
  - Mock files
  - Test setup files

## Usage Examples

### Unit Test Example
```typescript
import { createMockUser, mockUserCreate } from '../__mocks__/test-utils';
import { UserService } from '../services/user.service';

describe('UserService', () => {
  it('should create a user', async () => {
    const mockUser = createMockUser();
    mockUserCreate(mockUser);
    
    const result = await userService.createUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(result).toBeValidUser();
  });
});
```

### Integration Test Example
```typescript
import { setupTestDatabase, teardownTestDatabase } from '../config/test-database';

describe('User API Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  // Integration tests here
});
```

## Key Features

1. **TypeScript Support**: Full TypeScript support with ts-jest
2. **Database Mocking**: Comprehensive Prisma mocking for unit tests
3. **Test Data Generation**: Utilities for creating consistent test data
4. **Custom Matchers**: Domain-specific Jest matchers
5. **Environment Isolation**: Separate test environment configuration
6. **Coverage Reporting**: Detailed coverage reports with thresholds
7. **Integration Testing**: Support for both unit and integration tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

The testing framework is now fully configured and ready for comprehensive testing of the Node.js TypeScript API demo application.
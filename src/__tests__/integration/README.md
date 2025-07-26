# Integration Tests

This directory contains comprehensive integration tests for the Node.js TypeScript API demo application.

## Test Structure

### 1. Authentication Integration Tests (`auth.integration.test.ts`)
- Complete authentication flow: register → login → protected route access
- Authentication error scenarios (expired tokens, invalid credentials)
- Registration edge cases (duplicate emails, validation errors)
- Login edge cases (wrong passwords, malformed data)

### 2. User CRUD Integration Tests (`user-crud.integration.test.ts`)
- Full CRUD operations with authentication
- User lifecycle: create → read → update → delete
- Multi-user scenarios with proper isolation
- Database error handling
- Validation edge cases

### 3. Error Scenarios Integration Tests (`error-scenarios.integration.test.ts`)
- Authentication errors (missing tokens, expired tokens, malformed tokens)
- Validation errors (invalid data formats, missing fields)
- Database errors (connection failures, constraint violations)
- Resource not found scenarios
- Conflict errors (duplicate resources)
- Security and rate limiting scenarios

### 4. Docker Integration Tests (`docker.integration.test.ts`)
- Docker configuration validation
- Dockerfile and docker-compose.yml structure
- Container build process
- Service configuration validation
- Security and best practices validation
- Development vs production configurations

### 5. Complete API Integration Tests (`api.integration.test.ts`)
- End-to-end API functionality
- Health checks and monitoring
- Multi-user scenarios
- Performance and load testing
- CORS and security headers
- Content type handling
- Swagger documentation integration

## Running Integration Tests

### Run All Integration Tests
```bash
npm test -- --testPathPattern=integration
```

### Run Specific Integration Test Suite
```bash
# Authentication tests
npm test -- src/__tests__/integration/auth.integration.test.ts

# User CRUD tests
npm test -- src/__tests__/integration/user-crud.integration.test.ts

# Error scenarios
npm test -- src/__tests__/integration/error-scenarios.integration.test.ts

# Docker tests
npm test -- src/__tests__/integration/docker.integration.test.ts

# Complete API tests
npm test -- src/__tests__/integration/api.integration.test.ts
```

### Run with Coverage
```bash
npm run test:coverage -- --testPathPattern=integration
```

### Run in Watch Mode
```bash
npm run test:watch -- --testPathPattern=integration
```

## Test Environment

Integration tests use:
- **Supertest**: For HTTP request testing
- **Jest Mocks**: For external dependencies (bcrypt, jsonwebtoken, Prisma)
- **Test Environment**: Isolated test environment with `.env.test` configuration
- **Database Mocking**: Prisma client is mocked to avoid real database connections

## Test Data

Tests use mock data factories from `src/__mocks__/test-utils.ts`:
- `createMockUser()`: Creates mock user objects
- `createMockUsers()`: Creates arrays of mock users
- `testUserData`: Predefined test data for various scenarios

## Mocking Strategy

### External Dependencies
- **bcrypt**: Mocked for password hashing/comparison
- **jsonwebtoken**: Mocked for token generation/verification
- **Prisma Client**: Mocked for database operations

### Database Operations
All database operations are mocked using `jest-mock-extended` to:
- Avoid real database connections during testing
- Ensure predictable test results
- Test error scenarios safely
- Improve test performance

## Test Scenarios Covered

### Authentication Flow
- ✅ Complete registration → login → protected access flow
- ✅ Invalid credentials handling
- ✅ Token expiration and validation
- ✅ Malformed token handling
- ✅ User not found scenarios

### User Management
- ✅ Full CRUD operations with authentication
- ✅ Input validation for all operations
- ✅ Duplicate email prevention
- ✅ Password hashing verification
- ✅ Response data sanitization (password exclusion)

### Error Handling
- ✅ Authentication errors (401)
- ✅ Validation errors (400)
- ✅ Not found errors (404)
- ✅ Conflict errors (409)
- ✅ Internal server errors (500)
- ✅ Database connection failures
- ✅ Constraint violations

### Security
- ✅ JWT token validation
- ✅ Password hashing
- ✅ Input sanitization
- ✅ CORS headers
- ✅ Security headers (Helmet)
- ✅ Content type validation

### Docker & Deployment
- ✅ Docker configuration validation
- ✅ Container build process
- ✅ Service orchestration
- ✅ Environment variable handling
- ✅ Security best practices
- ✅ Multi-stage builds

### API Documentation
- ✅ Swagger UI availability
- ✅ OpenAPI specification
- ✅ Endpoint documentation
- ✅ Schema definitions

## Performance Testing

Integration tests include basic performance scenarios:
- Concurrent request handling
- Large payload processing
- Multiple user operations
- Database query optimization

## Docker Testing Notes

Docker integration tests include:
- Configuration file validation
- Build process verification (requires Docker installation)
- Security best practices validation
- Environment-specific configurations

**Note**: Some Docker tests require Docker to be installed and running. These tests will be skipped gracefully if Docker is not available.

## Continuous Integration

These integration tests are designed to run in CI/CD environments:
- No external dependencies required (all mocked)
- Deterministic results
- Fast execution
- Comprehensive coverage

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Mocking**: External dependencies are properly mocked
3. **Cleanup**: Test state is reset between tests
4. **Coverage**: Tests cover both happy paths and error scenarios
5. **Documentation**: Each test clearly describes what it's testing
6. **Maintainability**: Tests are organized and easy to understand

## Troubleshooting

### Common Issues

1. **Mock not working**: Ensure mocks are properly reset in `beforeEach`
2. **Async issues**: Use proper `await` for async operations
3. **Test timeout**: Increase timeout for slow operations
4. **Docker tests failing**: Ensure Docker is installed and running

### Debug Mode

Run tests with verbose output:
```bash
npm test -- --verbose --testPathPattern=integration
```

### Test Coverage

Check integration test coverage:
```bash
npm run test:coverage -- --testPathPattern=integration --coverageReporters=text
```
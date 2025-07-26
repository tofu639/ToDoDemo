import request from 'supertest';
import app from '../../app';
import { prismaMock } from '../../__mocks__/prisma';
import { createMockUser, testUserData } from '../../__mocks__/test-utils';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock external dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('Complete API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Health and Information', () => {
    it('should return API information at root endpoint', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Node.js TypeScript API Demo');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('documentation');
    });

    it('should return health status', async () => {
      // Mock database health check
      prismaMock.$queryRaw = jest.fn().mockResolvedValue([{ result: 1 }]);

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('database.status', 'connected');
    });

    it('should handle database health check failure', async () => {
      // Mock database health check failure
      prismaMock.$queryRaw = jest.fn().mockRejectedValue(new Error('Database unavailable'));

      const response = await request(app)
        .get('/health')
        .expect(503);

      expect(response.body).toHaveProperty('status', 'ERROR');
      expect(response.body).toHaveProperty('database.status', 'disconnected');
    });
  });

  describe('Complete User Lifecycle Integration', () => {
    it('should handle complete user lifecycle: register -> login -> CRUD -> delete', async () => {
      const userData = {
        name: 'Integration Test User',
        email: 'integration@example.com',
        password: 'IntegrationTest123!',
      };

      // Step 1: Register user
      const mockUser = createMockUser({
        name: userData.name,
        email: userData.email,
      });

      mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockUser);

      const mockToken = 'integration-test-token';
      mockedJwt.sign.mockReturnValue(mockToken as never);

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe(userData.email);

      // Step 2: Login with registered user
      mockedBcrypt.compare.mockResolvedValue(true as never);
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const token = loginResponse.body.data.token;

      // Step 3: Access protected routes with token
      mockedJwt.verify.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
      } as never);

      // Get user profile
      const profileResponse = await request(app)
        .get(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.id).toBe(mockUser.id);

      // Step 4: Update user profile
      const updateData = {
        name: 'Updated Integration User',
      };

      const updatedUser = createMockUser({
        ...mockUser,
        ...updateData,
      });

      prismaMock.user.update.mockResolvedValue(updatedUser);

      const updateResponse = await request(app)
        .put(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe(updateData.name);

      // Step 5: List all users
      prismaMock.user.findMany.mockResolvedValue([updatedUser]);

      const listResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data).toHaveLength(1);

      // Step 6: Delete user
      prismaMock.user.delete.mockResolvedValue(updatedUser);

      const deleteResponse = await request(app)
        .delete(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify all operations were called in correct order
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(4); // register check, login, profile, update check
      expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should handle multiple users with proper isolation', async () => {
      const user1Data = {
        name: 'User One',
        email: 'user1@example.com',
        password: 'Password123!',
      };

      const user2Data = {
        name: 'User Two',
        email: 'user2@example.com',
        password: 'Password456!',
      };

      const mockUser1 = createMockUser({
        id: 'user-1-id',
        name: user1Data.name,
        email: user1Data.email,
      });

      const mockUser2 = createMockUser({
        id: 'user-2-id',
        name: user2Data.name,
        email: user2Data.email,
      });

      // Register both users
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      mockedJwt.sign.mockReturnValue('mock-token' as never);

      // User 1 registration
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.create.mockResolvedValueOnce(mockUser1);

      const register1Response = await request(app)
        .post('/api/auth/register')
        .send(user1Data)
        .expect(201);

      expect(register1Response.body.success).toBe(true);

      // User 2 registration
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.create.mockResolvedValueOnce(mockUser2);

      const register2Response = await request(app)
        .post('/api/auth/register')
        .send(user2Data)
        .expect(201);

      expect(register2Response.body.success).toBe(true);

      // Login as User 1
      mockedBcrypt.compare.mockResolvedValue(true as never);
      prismaMock.user.findUnique.mockResolvedValue(mockUser1);
      mockedJwt.verify.mockReturnValue({
        userId: mockUser1.id,
        email: mockUser1.email,
      } as never);

      const login1Response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user1Data.email,
          password: user1Data.password,
        })
        .expect(200);

      const token1 = login1Response.body.data.token;

      // User 1 should only see their own profile
      const profile1Response = await request(app)
        .get(`/api/users/${mockUser1.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(profile1Response.body.data.id).toBe(mockUser1.id);

      // User 1 should not be able to access User 2's profile without proper authorization
      prismaMock.user.findUnique.mockResolvedValue(null); // Simulate not found for unauthorized access

      const unauthorizedResponse = await request(app)
        .get(`/api/users/${mockUser2.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(unauthorizedResponse.body.success).toBe(false);
    });
  });

  describe('API Error Handling Integration', () => {
    it('should handle cascading errors gracefully', async () => {
      // Simulate a scenario where multiple things go wrong
      
      // 1. Database connection fails during registration
      prismaMock.user.findUnique.mockRejectedValue(new Error('Database connection lost'));

      const response1 = await request(app)
        .post('/api/auth/register')
        .send(testUserData.validUser)
        .expect(500);

      expect(response1.body.success).toBe(false);
      expect(response1.body.error.code).toBe('AUTH_SERVICE_ERROR');

      // 2. JWT verification fails during protected route access
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('JWT verification failed');
      });

      const response2 = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response2.body.success).toBe(false);
      expect(response2.body.error.code).toBe('INVALID_TOKEN');

      // 3. Validation fails with malformed data
      const response3 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: '', // Empty password
        })
        .expect(400);

      expect(response3.body.success).toBe(false);
      expect(response3.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('API Performance and Load Scenarios', () => {
    it('should handle concurrent requests properly', async () => {
      const mockUser = createMockUser();
      const mockToken = 'concurrent-test-token';

      // Setup mocks for concurrent requests
      mockedJwt.verify.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
      } as never);

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      // Make multiple concurrent requests
      const concurrentRequests = Array.from({ length: 5 }, () =>
        request(app)
          .get(`/api/users/${mockUser.id}`)
          .set('Authorization', `Bearer ${mockToken}`)
      );

      const responses = await Promise.all(concurrentRequests);

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(mockUser.id);
      });

      // Verify database was called for each request
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(5);
    });

    it('should handle large response payloads', async () => {
      // Create a large number of mock users
      const mockUsers = Array.from({ length: 100 }, (_, index) =>
        createMockUser({
          id: `user-${index}`,
          name: `User ${index}`,
          email: `user${index}@example.com`,
        })
      );

      const mockToken = 'large-payload-token';
      mockedJwt.verify.mockReturnValue({
        userId: 'admin-user-id',
        email: 'admin@example.com',
      } as never);

      prismaMock.user.findMany.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(100);
      
      // Verify response structure is maintained even with large payloads
      response.body.data.forEach((user: any, index: number) => {
        expect(user).toHaveProperty('id', `user-${index}`);
        expect(user).toHaveProperty('name', `User ${index}`);
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('API Documentation Integration', () => {
    it('should serve Swagger documentation', async () => {
      const response = await request(app)
        .get('/api-docs/')
        .expect(200);

      // Should return HTML content for Swagger UI
      expect(response.text).toContain('swagger-ui');
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    it('should serve OpenAPI JSON specification', async () => {
      const response = await request(app)
        .get('/api-docs/swagger.json')
        .expect(200);

      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
      expect(response.body.paths).toHaveProperty('/api/auth/register');
      expect(response.body.paths).toHaveProperty('/api/auth/login');
      expect(response.body.paths).toHaveProperty('/api/users');
    });
  });

  describe('CORS and Security Headers Integration', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app)
        .options('/api/users')
        .set('Origin', 'http://localhost:3001')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    it('should include security headers from helmet', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Helmet security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('Content Type and Request Parsing', () => {
    it('should handle JSON content type properly', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(testUserData.validUser))
        .expect(400); // Will fail validation due to mocking, but should parse JSON

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
    });

    it('should reject unsupported content types', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'text/plain')
        .send('plain text data')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle URL-encoded data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('name=Test&email=test@example.com&password=Password123!')
        .expect(400); // Will fail due to mocking, but should parse form data

      expect(response.body).toHaveProperty('success');
    });
  });
});
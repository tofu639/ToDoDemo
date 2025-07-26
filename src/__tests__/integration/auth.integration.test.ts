import request from 'supertest';
import app from '../../app';
import { prismaMock } from '../../__mocks__/prisma';
import { createMockUser, testUserData } from '../../__mocks__/test-utils';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock bcrypt and jwt for integration tests
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full authentication flow: register -> login -> access protected route', async () => {
      // Step 1: Register a new user
      const mockUser = createMockUser({
        email: testUserData.validUser.email,
        name: testUserData.validUser.name,
      });

      // Mock bcrypt for password hashing during registration
      mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
      
      // Mock database operations for registration
      prismaMock.user.findUnique.mockResolvedValue(null); // No existing user
      prismaMock.user.create.mockResolvedValue(mockUser);

      // Mock JWT token generation
      const mockToken = 'mock-jwt-token-12345';
      mockedJwt.sign.mockReturnValue(mockToken as never);

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUserData.validUser)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data).toHaveProperty('token');
      expect(registerResponse.body.data).toHaveProperty('user');
      expect(registerResponse.body.data.user).not.toHaveProperty('password');

      // Step 2: Login with the registered user
      // Mock bcrypt for password comparison during login
      mockedBcrypt.compare.mockResolvedValue(true as never);
      
      // Mock database operations for login
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(testUserData.loginData)
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data).toHaveProperty('token');
      expect(loginResponse.body.data).toHaveProperty('user');
      expect(loginResponse.body.data.user).not.toHaveProperty('password');

      // Step 3: Access protected route with token
      const token = loginResponse.body.data.token;
      
      // Mock JWT verification for protected route access
      mockedJwt.verify.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
      } as never);

      // Mock database operation for protected route
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const protectedResponse = await request(app)
        .get(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(protectedResponse.body.success).toBe(true);
      expect(protectedResponse.body.data).toHaveProperty('id', mockUser.id);
      expect(protectedResponse.body.data).not.toHaveProperty('password');

      // Verify all expected calls were made
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(3); // register check, login, protected route
      expect(mockedBcrypt.hash).toHaveBeenCalledTimes(1);
      expect(mockedBcrypt.compare).toHaveBeenCalledTimes(1);
      expect(mockedJwt.sign).toHaveBeenCalledTimes(2); // register and login
      expect(mockedJwt.verify).toHaveBeenCalledTimes(1);
    });

    it('should handle authentication flow with invalid credentials', async () => {
      // Step 1: Try to login with non-existent user
      prismaMock.user.findUnique.mockResolvedValue(null);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(testUserData.invalidLoginData)
        .expect(401);

      expect(loginResponse.body.success).toBe(false);
      expect(loginResponse.body.error.code).toBe('INVALID_CREDENTIALS');

      // Step 2: Try to access protected route without token
      const protectedResponse = await request(app)
        .get('/api/users/some-id')
        .expect(401);

      expect(protectedResponse.body.success).toBe(false);
      expect(protectedResponse.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should handle authentication flow with expired token', async () => {
      // Mock JWT verification to throw expired token error
      mockedJwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired') as any;
        error.name = 'TokenExpiredError';
        throw error;
      });

      const protectedResponse = await request(app)
        .get('/api/users/some-id')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(protectedResponse.body.success).toBe(false);
      expect(protectedResponse.body.error.code).toBe('INVALID_TOKEN');
      expect(protectedResponse.body.error.message).toContain('expired');
    });

    it('should handle authentication flow with malformed token', async () => {
      // Mock JWT verification to throw malformed token error
      mockedJwt.verify.mockImplementation(() => {
        const error = new Error('jwt malformed') as any;
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const protectedResponse = await request(app)
        .get('/api/users/some-id')
        .set('Authorization', 'Bearer malformed-token')
        .expect(401);

      expect(protectedResponse.body.success).toBe(false);
      expect(protectedResponse.body.error.code).toBe('INVALID_TOKEN');
      expect(protectedResponse.body.error.message).toContain('Invalid token');
    });
  });

  describe('Registration Edge Cases', () => {
    it('should prevent duplicate email registration', async () => {
      const existingUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: existingUser.email,
          password: 'Password123!',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
      expect(response.body.error.message).toContain('already exists');
    });

    it('should validate registration input data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUserData.invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toBeDefined();
    });
  });

  describe('Login Edge Cases', () => {
    it('should handle wrong password during login', async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should validate login input data', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
import request from 'supertest';
import app from '../../app';
import { prismaMock } from '../../__mocks__/prisma';
import { createMockUser } from '../../__mocks__/test-utils';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Mock external dependencies
jest.mock('jsonwebtoken');
jest.mock('bcrypt');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Error Scenarios Integration Tests', () => {
  const mockUser = createMockUser();
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Error Scenarios', () => {
    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
      expect(response.body.error.message).toContain('Authorization header is required');
    });

    it('should handle malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN_FORMAT');
      expect(response.body.error.message).toContain('Authorization header must be in format: Bearer <token>');
    });

    it('should handle expired JWT token', async () => {
      mockedJwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired') as any;
        error.name = 'TokenExpiredError';
        throw error;
      });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toContain('expired');
    });

    it('should handle invalid JWT token', async () => {
      mockedJwt.verify.mockImplementation(() => {
        const error = new Error('invalid signature') as any;
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toContain('Invalid token');
    });

    it('should handle user not found during token validation', async () => {
      mockedJwt.verify.mockReturnValue({
        userId: 'non-existent-user-id',
        email: 'nonexistent@example.com',
      } as never);

      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toContain('User not found');
    });
  });

  describe('Validation Error Scenarios', () => {
    beforeEach(() => {
      // Setup valid authentication for validation tests
      mockedJwt.verify.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
      } as never);
    });

    it('should handle invalid email format in registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email-format',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContain('email');
    });

    it('should handle weak password in registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123', // Too weak
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContain('password');
    });

    it('should handle missing required fields in user creation', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          // Missing name, email, and password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toBeDefined();
    });

    it('should handle invalid data types in user update', async () => {
      const response = await request(app)
        .put(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          name: 123, // Should be string
          email: true, // Should be string
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle empty request body where data is required', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContain('email');
      expect(response.body.error.details).toContain('password');
    });
  });

  describe('Database Error Scenarios', () => {
    beforeEach(() => {
      // Setup valid authentication for database error tests
      mockedJwt.verify.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
      } as never);
    });

    it('should handle database connection errors', async () => {
      prismaMock.user.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(response.body.error.message).toContain('Internal server error');
    });

    it('should handle database constraint violations', async () => {
      const constraintError = new Error('Unique constraint failed') as any;
      constraintError.code = 'P2002';
      constraintError.meta = { target: ['email'] };

      prismaMock.user.create.mockRejectedValue(constraintError);

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should handle database timeout errors', async () => {
      const timeoutError = new Error('Query timeout') as any;
      timeoutError.code = 'P1008';

      prismaMock.user.findUnique.mockRejectedValue(timeoutError);

      const response = await request(app)
        .get(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('Resource Not Found Scenarios', () => {
    beforeEach(() => {
      // Setup valid authentication
      mockedJwt.verify.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
      } as never);
    });

    it('should handle non-existent user retrieval', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('User not found');
    });

    it('should handle non-existent user update', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle non-existent user deletion', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle invalid route endpoints', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Route not found');
    });
  });

  describe('Conflict Error Scenarios', () => {
    beforeEach(() => {
      // Setup valid authentication
      mockedJwt.verify.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
      } as never);
    });

    it('should handle duplicate email during registration', async () => {
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
      expect(response.body.error.code).toBe('CONFLICT_ERROR');
      expect(response.body.error.message).toContain('already exists');
    });

    it('should handle duplicate email during user creation', async () => {
      const existingUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          name: 'New User',
          email: existingUser.email,
          password: 'Password123!',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT_ERROR');
    });
  });

  describe('Rate Limiting and Security Scenarios', () => {
    it('should handle large request payloads', async () => {
      const largePayload = {
        name: 'A'.repeat(10000), // Very long name
        email: 'test@example.com',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(largePayload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BAD_REQUEST');
    });

    it('should handle unsupported content types', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'text/plain')
        .send('plain text data')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Edge Case Scenarios', () => {
    beforeEach(() => {
      // Setup valid authentication
      mockedJwt.verify.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
      } as never);
    });

    it('should handle concurrent user creation with same email', async () => {
      // Simulate race condition where two requests try to create user with same email
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // First check passes
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // Second check passes
      
      const existingUser = createMockUser();
      prismaMock.user.create.mockResolvedValueOnce(existingUser); // First creation succeeds
      
      const constraintError = new Error('Unique constraint failed') as any;
      constraintError.code = 'P2002';
      prismaMock.user.create.mockRejectedValueOnce(constraintError); // Second creation fails

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      };

      // First request should succeed
      const response1 = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(userData);

      expect(response1.status).toBe(201);

      // Second request should fail with constraint error
      const response2 = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(userData);

      expect(response2.status).toBe(500);
    });

    it('should handle password hashing failures', async () => {
      mockedBcrypt.hash.mockRejectedValue(new Error('Hashing failed') as never);

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should handle JWT signing failures during registration', async () => {
      const newUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(newUser);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      
      mockedJwt.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });
});
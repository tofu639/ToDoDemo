import request from 'supertest';
import app from '../../app';
import { prismaMock } from '../../__mocks__/prisma';
import { createMockUser, createMockUsers, testUserData } from '../../__mocks__/test-utils';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Mock JWT for authentication in protected routes
jest.mock('jsonwebtoken');
jest.mock('bcrypt');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Working Integration Tests', () => {
  const mockToken = 'mock-jwt-token';
  const mockUser = createMockUser();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default JWT verification for authenticated requests
    mockedJwt.verify.mockReturnValue({
      userId: mockUser.id,
      email: mockUser.email,
    } as never);
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
  });

  describe('User CRUD Operations (Working Tests)', () => {
    it('should return all users when authenticated', async () => {
      const mockUsers = createMockUsers(3);
      prismaMock.user.findMany.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).not.toHaveProperty('password');
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should require authentication to list users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    });

    it('should return specific user when authenticated', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', mockUser.id);
      expect(response.body.data).not.toHaveProperty('password');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should create new user when authenticated', async () => {
      const newUserData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!',
      };

      const createdUser = createMockUser({
        name: newUserData.name,
        email: newUserData.email,
      });

      // Mock password hashing
      mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
      
      // Mock database operations
      prismaMock.user.findUnique.mockResolvedValue(null); // No existing user
      prismaMock.user.create.mockResolvedValue(createdUser);

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(newUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', newUserData.name);
      expect(response.body.data).toHaveProperty('email', newUserData.email);
      expect(response.body.data).not.toHaveProperty('password');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: newUserData.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(newUserData.password, expect.any(Number));
      expect(prismaMock.user.create).toHaveBeenCalled();
    });

    it('should update user when authenticated', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const updatedUser = createMockUser({
        ...mockUser,
        ...updateData,
      });

      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser); // findById call
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // findByEmail call for conflict check
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', updateData.name);
      expect(response.body.data).toHaveProperty('email', updateData.email);
      expect(response.body.data).not.toHaveProperty('password');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateData,
      });
    });

    it('should delete user when authenticated', async () => {
      prismaMock.user.delete.mockResolvedValue(mockUser);

      const response = await request(app)
        .delete(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });
  });

  describe('Authentication Flow (Working Tests)', () => {
    it('should complete basic authentication flow', async () => {
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

      // Verify all expected calls were made
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(2); // register check, login
      expect(mockedBcrypt.hash).toHaveBeenCalledTimes(1);
      expect(mockedBcrypt.compare).toHaveBeenCalledTimes(1);
      expect(mockedJwt.sign).toHaveBeenCalledTimes(2); // register and login
    });

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
  });

  describe('Error Handling (Working Tests)', () => {
    it('should handle database errors gracefully', async () => {
      prismaMock.user.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_SERVICE_ERROR');
    });

    it('should prevent creating user with duplicate email', async () => {
      const existingUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          name: 'Another User',
          email: existingUser.email,
          password: 'Password123!',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
      expect(response.body.error.message).toContain('already exists');
    });

    it('should validate user creation input', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(testUserData.invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toBeDefined();
    });
  });

  describe('Complete User CRUD Flow', () => {
    it('should handle complete CRUD operations in sequence', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      };

      // Step 1: Create user
      const createdUser = createMockUser({
        name: userData.name,
        email: userData.email,
      });

      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(createdUser);

      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(userData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const userId = createResponse.body.data.id;

      // Step 2: Read user
      prismaMock.user.findUnique.mockResolvedValue(createdUser);

      const readResponse = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(readResponse.body.success).toBe(true);
      expect(readResponse.body.data.id).toBe(userId);

      // Step 3: Update user
      const updateData = { name: 'Updated Test User' };
      const updatedUser = createMockUser({
        ...createdUser,
        ...updateData,
      });

      prismaMock.user.update.mockResolvedValue(updatedUser);

      const updateResponse = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe(updateData.name);

      // Step 4: Delete user
      prismaMock.user.delete.mockResolvedValue(updatedUser);

      const deleteResponse = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify all operations were called
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(3); // create check, read, update check
      expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.delete).toHaveBeenCalledTimes(1);
    });
  });
});
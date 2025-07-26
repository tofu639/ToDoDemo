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

describe('User CRUD Integration Tests', () => {
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

  describe('GET /api/users - List all users', () => {
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

    it('should handle database errors gracefully', async () => {
      prismaMock.user.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_SERVICE_ERROR');
    });
  });

  describe('GET /api/users/:id - Get user by ID', () => {
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

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
      expect(response.body.error.message).toContain('User not found');
    });

    it('should require authentication to get user by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${mockUser.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('POST /api/users - Create new user', () => {
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

    it('should require authentication to create user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send(testUserData.validUser)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('PUT /api/users/:id - Update user', () => {
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

    it('should update user password when provided', async () => {
      const updateData = {
        name: 'Updated Name',
        password: 'NewPassword123!',
      };

      const updatedUser = createMockUser({
        ...mockUser,
        name: updateData.name,
      });

      mockedBcrypt.hash.mockResolvedValue('newHashedPassword' as never);
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', updateData.name);
      expect(response.body.data).not.toHaveProperty('password');

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(updateData.password, expect.any(Number));
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          name: updateData.name,
          password: 'newHashedPassword',
        },
      });
    });

    it('should return 404 for non-existent user update', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should validate update input data', async () => {
      const response = await request(app)
        .put(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          name: '', // Invalid name
          email: 'invalid-email', // Invalid email
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require authentication to update user', async () => {
      const response = await request(app)
        .put(`/api/users/${mockUser.id}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('DELETE /api/users/:id - Delete user', () => {
    it('should delete user when authenticated', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
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

    it('should return 404 for non-existent user deletion', async () => {
      const prismaError = new Error('Record not found') as any;
      prismaError.code = 'P2025';
      prismaMock.user.delete.mockRejectedValue(prismaError);

      const response = await request(app)
        .delete('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
    });

    it('should require authentication to delete user', async () => {
      const response = await request(app)
        .delete(`/api/users/${mockUser.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
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
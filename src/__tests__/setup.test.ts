// Test to verify the testing framework setup
import { prismaMock } from '../__mocks__/prisma';
import { createMockUser, testUserData } from '../__mocks__/test-utils';

describe('Testing Framework Setup', () => {
  describe('Jest Configuration', () => {
    it('should have TypeScript support', () => {
      const testValue = 'TypeScript works';
      expect(testValue).toBe('TypeScript works');
    });

    it('should have proper test environment', () => {
      expect(process.env['NODE_ENV']).toBe('test');
    });

    it('should load test environment variables', () => {
      expect(process.env['JWT_SECRET']).toBe('test-jwt-secret-key');
      expect(process.env['PORT']).toBe('3001');
    });
  });

  describe('Database Mocking', () => {
    it('should mock Prisma client', () => {
      expect(prismaMock).toBeDefined();
      expect(prismaMock.user).toBeDefined();
      expect(prismaMock.user.create).toBeDefined();
      expect(prismaMock.user.findUnique).toBeDefined();
      expect(prismaMock.user.findMany).toBeDefined();
      expect(prismaMock.user.update).toBeDefined();
      expect(prismaMock.user.delete).toBeDefined();
    });

    it('should create mock user data', () => {
      const mockUser = createMockUser();
      expect(mockUser).toHaveProperty('id');
      expect(mockUser).toHaveProperty('name');
      expect(mockUser).toHaveProperty('email');
      expect(mockUser).toHaveProperty('password');
      expect(mockUser).toHaveProperty('createdAt');
      expect(mockUser).toHaveProperty('updatedAt');
    });

    it('should mock database operations', async () => {
      const mockUser = createMockUser();
      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await prismaMock.user.create({
        data: testUserData.validUser,
      });

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: testUserData.validUser,
      });
    });
  });

  describe('External Library Mocking', () => {
    it('should support bcrypt mocking when needed', () => {
      // Test that bcrypt can be mocked in individual test files
      const bcrypt = require('bcrypt');
      expect(bcrypt).toBeDefined();
      expect(typeof bcrypt.hash).toBe('function');
      expect(typeof bcrypt.compare).toBe('function');
    });

    it('should support jsonwebtoken mocking when needed', () => {
      // Test that JWT can be mocked in individual test files
      const jwt = require('jsonwebtoken');
      expect(jwt).toBeDefined();
      expect(typeof jwt.sign).toBe('function');
      expect(typeof jwt.verify).toBe('function');
    });
  });

  describe('Custom Jest Matchers', () => {
    it('should validate user objects with custom matcher', () => {
      const validUser = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(validUser).toBeValidUser();
    });

    it('should validate auth response with custom matcher', () => {
      const validAuthResponse = {
        token: 'jwt-token',
        user: {
          id: 'test-id',
          name: 'Test User',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      expect(validAuthResponse).toBeValidAuthResponse();
    });

    it('should reject invalid user objects', () => {
      const invalidUser = {
        id: 'test-id',
        name: 'Test User',
        // missing email
        password: 'should-not-be-here',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(invalidUser).not.toBeValidUser();
    });
  });

  describe('Test Data Utilities', () => {
    it('should provide valid test user data', () => {
      expect(testUserData.validUser).toHaveProperty('name');
      expect(testUserData.validUser).toHaveProperty('email');
      expect(testUserData.validUser).toHaveProperty('password');
      expect(testUserData.validUser.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should provide invalid test user data', () => {
      expect(testUserData.invalidUser).toHaveProperty('name', '');
      expect(testUserData.invalidUser).toHaveProperty('email', 'invalid-email');
      expect(testUserData.invalidUser.password.length).toBeLessThan(8);
    });

    it('should provide login test data', () => {
      expect(testUserData.loginData).toHaveProperty('email');
      expect(testUserData.loginData).toHaveProperty('password');
      expect(testUserData.invalidLoginData).toHaveProperty('email');
      expect(testUserData.invalidLoginData).toHaveProperty('password');
    });
  });
});
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock Prisma Client
export const prismaMock = mockDeep<PrismaClient>();

// Reset mocks before each test
export const resetMocks = () => {
  mockReset(prismaMock);
};

// Test data generators
export const generateTestUser = (overrides: Partial<any> = {}) => {
  const defaultUser = {
    id: 'test-user-id-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };
  
  return { ...defaultUser, ...overrides };
};

export const generateTestUsers = (count: number = 3) => {
  return Array.from({ length: count }, (_, index) => 
    generateTestUser({
      id: `test-user-id-${index + 1}`,
      name: `Test User ${index + 1}`,
      email: `test${index + 1}@example.com`,
    })
  );
};

// Authentication test helpers
export const generateTestToken = (payload: any = { userId: 'test-user-id-1', email: 'test@example.com' }) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};

export const generateExpiredToken = (payload: any = { userId: 'test-user-id-1', email: 'test@example.com' }) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '-1h' });
};

// Password test helpers
export const generateHashedPassword = async (password: string = 'testPassword123') => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '4');
  return await bcrypt.hash(password, rounds);
};

// Request body generators
export const generateUserCreateRequest = (overrides: Partial<any> = {}) => {
  const defaultRequest = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'TestPassword123!',
  };
  
  return { ...defaultRequest, ...overrides };
};

export const generateUserUpdateRequest = (overrides: Partial<any> = {}) => {
  const defaultRequest = {
    name: 'Updated User',
    email: 'updated@example.com',
  };
  
  return { ...defaultRequest, ...overrides };
};

export const generateLoginRequest = (overrides: Partial<any> = {}) => {
  const defaultRequest = {
    email: 'test@example.com',
    password: 'TestPassword123!',
  };
  
  return { ...defaultRequest, ...overrides };
};

// Error response generators
export const generateValidationError = (field: string, message: string) => {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: {
        [field]: message,
      },
    },
  };
};

export const generateAuthError = (message: string = 'Authentication failed') => {
  return {
    success: false,
    error: {
      code: 'AUTH_ERROR',
      message,
    },
  };
};

// Database mock helpers
export const mockUserCreate = (returnValue: any) => {
  prismaMock.user.create.mockResolvedValue(returnValue);
};

export const mockUserFindUnique = (returnValue: any) => {
  prismaMock.user.findUnique.mockResolvedValue(returnValue);
};

export const mockUserFindMany = (returnValue: any[]) => {
  prismaMock.user.findMany.mockResolvedValue(returnValue);
};

export const mockUserUpdate = (returnValue: any) => {
  prismaMock.user.update.mockResolvedValue(returnValue);
};

export const mockUserDelete = (returnValue: any) => {
  prismaMock.user.delete.mockResolvedValue(returnValue);
};

// Test environment helpers
export const setupTestEnvironment = () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.BCRYPT_ROUNDS = '4';
};

export const cleanupTestEnvironment = () => {
  // Reset any test-specific configurations
  resetMocks();
};
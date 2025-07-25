import { User } from '@prisma/client';
import { prismaMock } from './prisma';

// Test data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashedPassword123',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

export const createMockUsers = (count: number = 3): User[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockUser({
      id: `test-user-id-${index + 1}`,
      name: `Test User ${index + 1}`,
      email: `test${index + 1}@example.com`,
    })
  );
};

// Database mock helpers
export const mockUserCreate = (user: User) => {
  prismaMock.user.create.mockResolvedValue(user);
  return user;
};

export const mockUserFindUnique = (user: User | null) => {
  prismaMock.user.findUnique.mockResolvedValue(user);
  return user;
};

export const mockUserFindMany = (users: User[]) => {
  prismaMock.user.findMany.mockResolvedValue(users);
  return users;
};

export const mockUserUpdate = (user: User) => {
  prismaMock.user.update.mockResolvedValue(user);
  return user;
};

export const mockUserDelete = (user: User) => {
  prismaMock.user.delete.mockResolvedValue(user);
  return user;
};

// Reset all database mocks
export const resetDatabaseMocks = () => {
  prismaMock.user.create.mockReset();
  prismaMock.user.findUnique.mockReset();
  prismaMock.user.findMany.mockReset();
  prismaMock.user.update.mockReset();
  prismaMock.user.delete.mockReset();
};

// Test request helpers
export const createAuthHeaders = (token: string = 'mock-jwt-token') => ({
  Authorization: `Bearer ${token}`,
});

// Common test data
export const testUserData = {
  validUser: {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123!',
  },
  invalidUser: {
    name: '',
    email: 'invalid-email',
    password: '123',
  },
  updateData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
  },
  loginData: {
    email: 'john@example.com',
    password: 'Password123!',
  },
  invalidLoginData: {
    email: 'wrong@example.com',
    password: 'wrongpassword',
  },
};

// Error response helpers
export const expectValidationError = (response: any, field?: string) => {
  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  if (field) {
    expect(response.body.error.details).toContain(field);
  }
};

export const expectAuthenticationError = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
};

export const expectNotFoundError = (response: any) => {
  expect(response.status).toBe(404);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('NOT_FOUND');
};

export const expectSuccessResponse = (response: any, statusCode: number = 200) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(true);
};
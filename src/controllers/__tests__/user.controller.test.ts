import { Request, Response } from 'express';
import { UserController } from '../user.controller';
import { userService, UserNotFoundError, UserAlreadyExistsError, UserServiceError } from '../../services/user.service';
import { User } from '@prisma/client';

// Mock the user service
jest.mock('../../services/user.service');

describe('UserController', () => {
  let userController: UserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  // Sample user data for testing
  const sampleUser: User = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  };

  const sampleUserWithoutPassword = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  };

  beforeEach(() => {
    userController = new UserController();
    
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      params: {},
      body: {},
      path: '/users'
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users without passwords', async () => {
      const users = [sampleUser, { ...sampleUser, id: 'user-456', email: 'jane@example.com' }];
      (userService.findAll as jest.Mock).mockResolvedValue(users);

      await userController.getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(userService.findAll).toHaveBeenCalledTimes(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: [
          sampleUserWithoutPassword,
          { ...sampleUserWithoutPassword, id: 'user-456', email: 'jane@example.com' }
        ],
        timestamp: expect.any(String)
      });
    });

    it('should handle UserServiceError', async () => {
      const error = { message: 'Database connection failed', name: 'UserServiceError' };
      Object.setPrototypeOf(error, UserServiceError.prototype);
      (userService.findAll as jest.Mock).mockRejectedValue(error);

      await userController.getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_SERVICE_ERROR',
          message: 'Database connection failed'
        },
        timestamp: expect.any(String),
        path: '/users'
      });
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Unexpected error');
      (userService.findAll as jest.Mock).mockRejectedValue(error);

      await userController.getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        },
        timestamp: expect.any(String),
        path: '/users'
      });
    });
  });

  describe('getUserById', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'user-123' };
    });

    it('should return user by ID without password', async () => {
      (userService.findById as jest.Mock).mockResolvedValue(sampleUser);

      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      expect(userService.findById).toHaveBeenCalledWith('user-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: sampleUserWithoutPassword,
        timestamp: expect.any(String)
      });
    });

    it('should return 400 when user ID is missing', async () => {
      mockRequest.params = {};

      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      expect(userService.findById).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'User ID is required'
        },
        timestamp: expect.any(String),
        path: '/users'
      });
    });

    it('should return 404 when user not found', async () => {
      (userService.findById as jest.Mock).mockResolvedValue(null);

      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User with ID user-123 not found'
        },
        timestamp: expect.any(String),
        path: '/users'
      });
    });

    it('should handle UserServiceError', async () => {
      const error = { message: 'Database error', name: 'UserServiceError' };
      Object.setPrototypeOf(error, UserServiceError.prototype);
      (userService.findById as jest.Mock).mockRejectedValue(error);

      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_SERVICE_ERROR',
          message: 'Database error'
        },
        timestamp: expect.any(String),
        path: '/users'
      });
    });
  });

  describe('createUser', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123'
    };

    beforeEach(() => {
      mockRequest.body = userData;
    });

    it('should create user successfully', async () => {
      (userService.createUser as jest.Mock).mockResolvedValue(sampleUser);

      await userController.createUser(mockRequest as Request, mockResponse as Response);

      expect(userService.createUser).toHaveBeenCalledWith(userData);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: sampleUserWithoutPassword,
        message: 'User created successfully',
        timestamp: expect.any(String)
      });
    });

    it('should handle UserAlreadyExistsError', async () => {
      const error = { message: 'User with email john@example.com already exists', name: 'UserAlreadyExistsError' };
      Object.setPrototypeOf(error, UserAlreadyExistsError.prototype);
      (userService.createUser as jest.Mock).mockRejectedValue(error);

      await userController.createUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'User with email john@example.com already exists'
        },
        timestamp: expect.any(String),
        path: '/users'
      });
    });

    it('should handle UserServiceError', async () => {
      const error = { message: 'Database error', name: 'UserServiceError' };
      Object.setPrototypeOf(error, UserServiceError.prototype);
      (userService.createUser as jest.Mock).mockRejectedValue(error);

      await userController.createUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_SERVICE_ERROR',
          message: 'Database error'
        },
        timestamp: expect.any(String),
        path: '/users'
      });
    });
  });

  describe('updateUser', () => {
    const updateData = {
      name: 'John Updated',
      email: 'john.updated@example.com'
    };

    beforeEach(() => {
      mockRequest.params = { id: 'user-123' };
      mockRequest.body = updateData;
    });

    it('should update user successfully', async () => {
      const updatedUser = { ...sampleUser, ...updateData };
      (userService.updateUser as jest.Mock).mockResolvedValue(updatedUser);

      await userController.updateUser(mockRequest as Request, mockResponse as Response);

      expect(userService.updateUser).toHaveBeenCalledWith('user-123', updateData);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { ...sampleUserWithoutPassword, ...updateData },
        message: 'User updated successfully',
        timestamp: expect.any(String)
      });
    });

    it('should return 400 when user ID is missing', async () => {
      mockRequest.params = {};

      await userController.updateUser(mockRequest as Request, mockResponse as Response);

      expect(userService.updateUser).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'User ID is required'
        },
        timestamp: expect.any(String),
        path: '/users'
      });
    });

    it('should handle UserNotFoundError', async () => {
      const error = { message: 'User not found: user-123', name: 'UserNotFoundError' };
      Object.setPrototypeOf(error, UserNotFoundError.prototype);
      (userService.updateUser as jest.Mock).mockRejectedValue(error);

      await userController.updateUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found: user-123'
        },
        timestamp: expect.any(String),
        path: '/users'
      });
    });

    it('should handle UserAlreadyExistsError', async () => {
      const error = { message: 'User with email john.updated@example.com already exists', name: 'UserAlreadyExistsError' };
      Object.setPrototypeOf(error, UserAlreadyExistsError.prototype);
      (userService.updateUser as jest.Mock).mockRejectedValue(error);

      await userController.updateUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'User with email john.updated@example.com already exists'
        },
        timestamp: expect.any(String),
        path: '/users'
      });
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'user-123' };
    });

    it('should delete user successfully', async () => {
      (userService.deleteUser as jest.Mock).mockResolvedValue(undefined);

      await userController.deleteUser(mockRequest as Request, mockResponse as Response);

      expect(userService.deleteUser).toHaveBeenCalledWith('user-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully',
        timestamp: expect.any(String)
      });
    });

    it('should return 400 when user ID is missing', async () => {
      mockRequest.params = {};

      await userController.deleteUser(mockRequest as Request, mockResponse as Response);

      expect(userService.deleteUser).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'User ID is required'
        },
        timestamp: expect.any(String),
        path: '/users'
      });
    });

    it('should handle UserNotFoundError', async () => {
      const error = { message: 'User not found: user-123', name: 'UserNotFoundError' };
      Object.setPrototypeOf(error, UserNotFoundError.prototype);
      (userService.deleteUser as jest.Mock).mockRejectedValue(error);

      await userController.deleteUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found: user-123'
        },
        timestamp: expect.any(String),
        path: '/users'
      });
    });

    it('should handle UserServiceError', async () => {
      const error = { message: 'Database error', name: 'UserServiceError' };
      Object.setPrototypeOf(error, UserServiceError.prototype);
      (userService.deleteUser as jest.Mock).mockRejectedValue(error);

      await userController.deleteUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_SERVICE_ERROR',
          message: 'Database error'
        },
        timestamp: expect.any(String),
        path: '/users'
      });
    });
  });
});
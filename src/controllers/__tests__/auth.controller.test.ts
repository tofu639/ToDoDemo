import { Request, Response } from 'express';
import { AuthController } from '../auth.controller';
import { authService, InvalidCredentialsError, AuthServiceError, AuthResponse } from '../../services/auth.service';
import { UserAlreadyExistsError } from '../../services/user.service';
import { User } from '@prisma/client';

// Mock the auth service
jest.mock('../../services/auth.service');

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  // Sample user data for testing
  const sampleUser: Omit<User, 'password'> = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  };

  const sampleAuthResponse: AuthResponse = {
    token: 'jwt-token-123',
    user: sampleUser
  };

  beforeEach(() => {
    authController = new AuthController();
    
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      body: {},
      path: '/auth'
    } as Request;
    
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registrationData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123'
    };

    beforeEach(() => {
      mockRequest.body = registrationData;
      (mockRequest as any).path = '/auth/register';
    });

    it('should register user successfully', async () => {
      (authService.register as jest.Mock).mockResolvedValue(sampleAuthResponse);

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(authService.register).toHaveBeenCalledWith(registrationData);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: sampleAuthResponse,
        message: 'User registered successfully',
        timestamp: expect.any(String)
      });
    });

    it('should handle UserAlreadyExistsError', async () => {
      const error = { message: 'User with email john@example.com already exists', name: 'UserAlreadyExistsError' };
      Object.setPrototypeOf(error, UserAlreadyExistsError.prototype);
      (authService.register as jest.Mock).mockRejectedValue(error);

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'User with email john@example.com already exists'
        },
        timestamp: expect.any(String),
        path: '/auth/register'
      });
    });

    it('should handle AuthServiceError', async () => {
      const error = { message: 'Registration failed', name: 'AuthServiceError' };
      Object.setPrototypeOf(error, AuthServiceError.prototype);
      (authService.register as jest.Mock).mockRejectedValue(error);

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_SERVICE_ERROR',
          message: 'Registration failed'
        },
        timestamp: expect.any(String),
        path: '/auth/register'
      });
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Unexpected error');
      (authService.register as jest.Mock).mockRejectedValue(error);

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        },
        timestamp: expect.any(String),
        path: '/auth/register'
      });
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'john@example.com',
      password: 'Password123'
    };

    beforeEach(() => {
      mockRequest.body = loginData;
      (mockRequest as any).path = '/auth/login';
    });

    it('should login user successfully', async () => {
      (authService.login as jest.Mock).mockResolvedValue(sampleAuthResponse);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(authService.login).toHaveBeenCalledWith(loginData);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: sampleAuthResponse,
        message: 'Login successful',
        timestamp: expect.any(String)
      });
    });

    it('should handle InvalidCredentialsError', async () => {
      const error = { message: 'Invalid email or password', name: 'InvalidCredentialsError' };
      Object.setPrototypeOf(error, InvalidCredentialsError.prototype);
      (authService.login as jest.Mock).mockRejectedValue(error);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        },
        timestamp: expect.any(String),
        path: '/auth/login'
      });
    });

    it('should handle AuthServiceError', async () => {
      const error = { message: 'Login failed', name: 'AuthServiceError' };
      Object.setPrototypeOf(error, AuthServiceError.prototype);
      (authService.login as jest.Mock).mockRejectedValue(error);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_SERVICE_ERROR',
          message: 'Login failed'
        },
        timestamp: expect.any(String),
        path: '/auth/login'
      });
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Unexpected error');
      (authService.login as jest.Mock).mockRejectedValue(error);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        },
        timestamp: expect.any(String),
        path: '/auth/login'
      });
    });

    it('should handle empty login data', async () => {
      mockRequest.body = {};

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(authService.login).toHaveBeenCalledWith({});
    });

    it('should handle partial login data', async () => {
      const partialLoginData = { email: 'john@example.com' };
      mockRequest.body = partialLoginData;

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(authService.login).toHaveBeenCalledWith(partialLoginData);
    });
  });
});
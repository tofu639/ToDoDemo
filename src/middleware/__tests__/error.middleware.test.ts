import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorHandler, notFoundHandler, asyncHandler, AppError } from '../error.middleware';

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      path: '/test',
      method: 'GET'
    };
    
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnThis();
    
    mockResponse = {
      status: statusSpy as any,
      json: jsonSpy as any
    };
    
    // Make status return the response object with json method
    statusSpy.mockReturnValue({ json: jsonSpy });
    
    mockNext = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('AppError', () => {
    it('should create error with default values', () => {
      // Act
      const error = new AppError('Test error');

      // Assert
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.name).toBe('AppError');
      expect(error.details).toBeUndefined();
    });

    it('should create error with custom values', () => {
      // Act
      const error = new AppError('Custom error', 400, 'CUSTOM_CODE', { field: 'test' });

      // Assert
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.details).toEqual({ field: 'test' });
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      // Arrange
      const error = new AppError('Custom error', 400, 'CUSTOM_CODE', { field: 'test' });

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CUSTOM_CODE',
          message: 'Custom error',
          details: { field: 'test' }
        },
        timestamp: expect.any(String),
        path: '/test'
      });
    });

    it('should handle ZodError correctly', () => {
      // Arrange
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number'
        },
        {
          code: 'invalid_string',
          validation: 'email',
          path: ['email'],
          message: 'Invalid email'
        }
      ]);

      // Act
      errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: [
            {
              field: 'name',
              message: 'Expected string, received number',
              code: 'invalid_type'
            },
            {
              field: 'email',
              message: 'Invalid email',
              code: 'invalid_string'
            }
          ]
        },
        timestamp: expect.any(String),
        path: '/test'
      });
    });

    it('should handle JsonWebTokenError correctly', () => {
      // Arrange
      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';

      // Act
      errorHandler(jwtError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
    });

    it('should handle TokenExpiredError correctly', () => {
      // Arrange
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';

      // Act
      errorHandler(expiredError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
    });

    it('should handle CastError correctly', () => {
      // Arrange
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';

      // Act
      errorHandler(castError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid resource identifier'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
    });

    it('should handle duplicate key errors correctly', () => {
      // Arrange
      const duplicateError = new Error('duplicate key value violates unique constraint');

      // Act
      errorHandler(duplicateError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(409);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DUPLICATE_RESOURCE',
          message: 'Resource already exists'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
    });

    it('should handle unique constraint errors correctly', () => {
      // Arrange
      const uniqueError = new Error('unique constraint failed');

      // Act
      errorHandler(uniqueError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(409);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DUPLICATE_RESOURCE',
          message: 'Resource already exists'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
    });

    it('should handle not found errors correctly', () => {
      // Arrange
      const notFoundError = new Error('User not found');

      // Act
      errorHandler(notFoundError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
    });

    it('should handle generic errors in development mode', () => {
      // Arrange
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';
      const genericError = new Error('Something went wrong');

      // Act
      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Something went wrong'
        },
        timestamp: expect.any(String),
        path: '/test'
      });

      // Cleanup
      process.env['NODE_ENV'] = originalEnv;
    });

    it('should handle generic errors in production mode', () => {
      // Arrange
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';
      const genericError = new Error('Something went wrong');

      // Act
      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        },
        timestamp: expect.any(String),
        path: '/test'
      });

      // Cleanup
      process.env['NODE_ENV'] = originalEnv;
    });

    it('should log error details', () => {
      // Arrange
      const error = new Error('Test error');
      const consoleSpy = jest.spyOn(console, 'error');

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Error occurred:', {
        message: 'Test error',
        stack: expect.any(String),
        path: '/test',
        method: 'GET',
        timestamp: expect.any(String)
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should create AppError for unmatched routes', () => {
      // Arrange
      const testRequest = {
        ...mockRequest,
        method: 'POST',
        path: '/nonexistent'
      };

      // Act
      notFoundHandler(testRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Route POST /nonexistent not found',
          statusCode: 404,
          code: 'NOT_FOUND'
        })
      );
    });
  });

  describe('asyncHandler', () => {
    it('should call next with error when async function throws', async () => {
      // Arrange
      const asyncFunction = jest.fn().mockRejectedValue(new Error('Async error'));
      const wrappedFunction = asyncHandler(asyncFunction);

      // Act
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(asyncFunction).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(new Error('Async error'));
    });

    it('should not call next when async function succeeds', async () => {
      // Arrange
      const asyncFunction = jest.fn().mockResolvedValue('success');
      const wrappedFunction = asyncHandler(asyncFunction);

      // Act
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(asyncFunction).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle synchronous functions that return promises', async () => {
      // Arrange
      const syncFunction = jest.fn().mockReturnValue(Promise.resolve('success'));
      const wrappedFunction = asyncHandler(syncFunction);

      // Act
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(syncFunction).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
import { Request, Response, NextFunction } from 'express';
import { authenticateToken, optionalAuth } from '../auth.middleware';
import { JWTUtil } from '../../utils/jwt.util';

// Mock the JWTUtil
jest.mock('../../utils/jwt.util');
const mockJWTUtil = JWTUtil as jest.Mocked<typeof JWTUtil>;

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      path: '/test'
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

  describe('authenticateToken', () => {
    it('should call next() when valid token is provided', () => {
      // Arrange
      const mockPayload = { userId: '123', email: 'test@example.com' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockJWTUtil.verifyToken.mockReturnValue(mockPayload);

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockJWTUtil.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization header is required'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header format is invalid', () => {
      // Arrange
      mockRequest.headers = { authorization: 'InvalidFormat token' };

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Bearer token is empty', () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer ' };

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Token is required'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer expired-token' };
      mockJWTUtil.verifyToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token expired'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockJWTUtil.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 when JWT_SECRET is missing', () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer some-token' };
      mockJWTUtil.verifyToken.mockImplementation(() => {
        throw new Error('JWT_SECRET environment variable is required');
      });

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'JWT_SECRET environment variable is required'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for unexpected errors', () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer some-token' };
      mockJWTUtil.verifyToken.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Unexpected error'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer some-token' };
      mockJWTUtil.verifyToken.mockImplementation(() => {
        throw 'String error';
      });

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error during authentication'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should call next() when no authorization header is provided', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
      expect(mockJWTUtil.verifyToken).not.toHaveBeenCalled();
    });

    it('should validate token when authorization header is provided', () => {
      // Arrange
      const mockPayload = { userId: '123', email: 'test@example.com' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockJWTUtil.verifyToken.mockReturnValue(mockPayload);

      // Act
      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockJWTUtil.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should return error when invalid token is provided', () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockJWTUtil.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
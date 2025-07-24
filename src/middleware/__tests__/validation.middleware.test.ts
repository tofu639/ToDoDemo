import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest, validateBody, validateParams, validateQuery } from '../validation.middleware';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
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

  describe('validateRequest', () => {
    const testSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      age: z.number().min(0).optional()
    });

    describe('body validation', () => {
      it('should call next() when body data is valid', () => {
        // Arrange
        const validData = { name: 'John', email: 'john@example.com' };
        mockRequest.body = validData;
        const middleware = validateRequest(testSchema, 'body');

        // Act
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalled();
        expect(mockRequest.body).toEqual(validData);
        expect(statusSpy).not.toHaveBeenCalled();
      });

      it('should transform data when validation passes', () => {
        // Arrange
        const inputData = { name: 'John', email: 'john@example.com', age: 25 };
        const expectedData = { name: 'John', email: 'john@example.com', age: 25 };
        mockRequest.body = inputData;
        const middleware = validateRequest(testSchema, 'body');

        // Act
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalled();
        expect(mockRequest.body).toEqual(expectedData);
      });

      it('should return 400 when body data is invalid', () => {
        // Arrange
        const invalidData = { name: 'J', email: 'invalid-email' };
        mockRequest.body = invalidData;
        const middleware = validateRequest(testSchema, 'body');

        // Act
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(statusSpy).toHaveBeenCalledWith(400);
        expect(jsonSpy).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'name',
                message: expect.stringContaining('at least 2'),
                code: expect.any(String)
              }),
              expect.objectContaining({
                field: 'email',
                message: expect.stringContaining('email'),
                code: expect.any(String)
              })
            ])
          },
          timestamp: expect.any(String),
          path: '/test'
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should return 400 when required fields are missing', () => {
        // Arrange
        mockRequest.body = {};
        const middleware = validateRequest(testSchema, 'body');

        // Act
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(statusSpy).toHaveBeenCalledWith(400);
        expect(jsonSpy).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'name',
                message: expect.stringContaining('Required'),
                code: expect.any(String)
              }),
              expect.objectContaining({
                field: 'email',
                message: expect.stringContaining('Required'),
                code: expect.any(String)
              })
            ])
          },
          timestamp: expect.any(String),
          path: '/test'
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('params validation', () => {
      const paramsSchema = z.object({
        id: z.string().min(1),
        type: z.enum(['user', 'admin'])
      });

      it('should validate params when source is params', () => {
        // Arrange
        const validParams = { id: '123', type: 'user' };
        mockRequest.params = validParams;
        const middleware = validateRequest(paramsSchema, 'params');

        // Act
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalled();
        expect(mockRequest.params).toEqual(validParams);
        expect(statusSpy).not.toHaveBeenCalled();
      });

      it('should return 400 when params are invalid', () => {
        // Arrange
        const invalidParams = { id: '', type: 'invalid' };
        mockRequest.params = invalidParams;
        const middleware = validateRequest(paramsSchema, 'params');

        // Act
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(statusSpy).toHaveBeenCalledWith(400);
        expect(jsonSpy).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'id',
                message: expect.any(String),
                code: expect.any(String)
              }),
              expect.objectContaining({
                field: 'type',
                message: expect.any(String),
                code: expect.any(String)
              })
            ])
          },
          timestamp: expect.any(String),
          path: '/test'
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('query validation', () => {
      const querySchema = z.object({
        page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
        limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
        search: z.string().optional()
      });

      it('should validate query when source is query', () => {
        // Arrange
        const validQuery = { page: '1', limit: '10', search: 'test' };
        mockRequest.query = validQuery;
        const middleware = validateRequest(querySchema, 'query');

        // Act
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalled();
        expect(mockRequest.query).toEqual({ page: 1, limit: 10, search: 'test' });
        expect(statusSpy).not.toHaveBeenCalled();
      });

      it('should return 400 when query params are invalid', () => {
        // Arrange
        const invalidQuery = { page: '0', limit: '200' };
        mockRequest.query = invalidQuery;
        const middleware = validateRequest(querySchema, 'query');

        // Act
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(statusSpy).toHaveBeenCalledWith(400);
        expect(jsonSpy).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: expect.any(String),
                message: expect.any(String),
                code: expect.any(String)
              })
            ])
          },
          timestamp: expect.any(String),
          path: '/test'
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    it('should handle non-Zod errors gracefully', () => {
      // Arrange
      const faultySchema = {
        parse: () => {
          throw new Error('Unexpected error');
        }
      } as any;
      mockRequest.body = { test: 'data' };
      const middleware = validateRequest(faultySchema, 'body');

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error during validation'
        },
        timestamp: expect.any(String),
        path: '/test'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateBody', () => {
    it('should create middleware that validates request body', () => {
      // Arrange
      const schema = z.object({ name: z.string() });
      const validData = { name: 'John' };
      mockRequest.body = validData;
      const middleware = validateBody(schema);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body).toEqual(validData);
    });
  });

  describe('validateParams', () => {
    it('should create middleware that validates request params', () => {
      // Arrange
      const schema = z.object({ id: z.string() });
      const validParams = { id: '123' };
      mockRequest.params = validParams;
      const middleware = validateParams(schema);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.params).toEqual(validParams);
    });
  });

  describe('validateQuery', () => {
    it('should create middleware that validates request query', () => {
      // Arrange
      const schema = z.object({ search: z.string().optional() });
      const validQuery = { search: 'test' };
      mockRequest.query = validQuery;
      const middleware = validateQuery(schema);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.query).toEqual(validQuery);
    });
  });
});
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'SERVER_ERROR';
    this.details = details;
    this.name = 'AppError';
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * This should be the last middleware in the chain
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let errorCode = 'SERVER_ERROR';
  let message = 'Internal server error';
  let details: any = undefined;

  // Log the error for debugging (in production, use proper logging)
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle different types of errors
  if (error instanceof AppError) {
    // Custom application errors
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    // Zod validation errors (fallback if not caught by validation middleware)
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  } else if (error.name === 'JsonWebTokenError') {
    // JWT errors (fallback if not caught by auth middleware)
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    // JWT expiration errors
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  } else if (error.name === 'CastError') {
    // Database casting errors (e.g., invalid ObjectId)
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Invalid resource identifier';
  } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
    // Database unique constraint violations
    statusCode = 409;
    errorCode = 'DUPLICATE_RESOURCE';
    message = 'Resource already exists';
  } else if (error.message.includes('not found')) {
    // Generic not found errors
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = 'Resource not found';
  } else {
    // Generic server errors
    statusCode = 500;
    errorCode = 'SERVER_ERROR';
    message = process.env['NODE_ENV'] === 'production' 
      ? 'Internal server error' 
      : error.message;
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details })
    },
    timestamp: new Date().toISOString(),
    path: req.path
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware to handle 404 errors for unmatched routes
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new AppError(
    `Route ${req.method} ${req.path} not found`,
    404,
    'NOT_FOUND'
  );
  
  next(error);
};

/**
 * Async error wrapper to catch errors in async route handlers
 * @param fn - Async function to wrap
 * @returns Express middleware function
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
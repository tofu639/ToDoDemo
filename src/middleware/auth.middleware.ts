import { Request, Response, NextFunction } from 'express';
import { JWTUtil, JWTPayload } from '../utils/jwt.util';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware for protecting routes with JWT tokens
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization header is required'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    // Check if header follows "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    const token = parts[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Token is required'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    // Verify the token
    const decoded = JWTUtil.verifyToken(token);
    
    // Attach user info to request object
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof Error) {
      let errorCode = 'INVALID_TOKEN';
      let statusCode = 401;
      
      if (error.message === 'Token expired') {
        errorCode = 'TOKEN_EXPIRED';
      } else if (error.message === 'Invalid token') {
        errorCode = 'INVALID_TOKEN';
      } else if (error.message.includes('JWT_SECRET')) {
        errorCode = 'SERVER_ERROR';
        statusCode = 500;
      }
      
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: error.message
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    // Fallback for unexpected errors
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error during authentication'
      },
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 * but validates token if present
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    next();
    return;
  }
  
  // If auth header is present, validate it
  authenticateToken(req, res, next);
};
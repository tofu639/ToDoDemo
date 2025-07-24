// Authentication middleware
export { authenticateToken, optionalAuth } from './auth.middleware';

// Validation middleware
export { 
  validateRequest, 
  validateBody, 
  validateParams, 
  validateQuery 
} from './validation.middleware';

// Error handling middleware
export { 
  errorHandler, 
  notFoundHandler, 
  asyncHandler, 
  AppError,
  type ErrorResponse 
} from './error.middleware';
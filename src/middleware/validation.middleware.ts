import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Interface for validation error details
 */
interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

/**
 * Validation middleware factory that creates middleware for validating request data
 * @param schema - Zod schema to validate against
 * @param source - Source of data to validate ('body', 'params', 'query')
 * @returns Express middleware function
 */
export const validateRequest = (
  schema: ZodSchema,
  source: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let dataToValidate;
      
      switch (source) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        default:
          dataToValidate = req.body;
      }

      // Validate the data against the schema
      const validatedData = schema.parse(dataToValidate);
      
      // Replace the original data with validated/transformed data
      switch (source) {
        case 'body':
          req.body = validatedData;
          break;
        case 'params':
          req.params = validatedData;
          break;
        case 'query':
          req.query = validatedData;
          break;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationErrorDetail[] = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: validationErrors
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // Handle unexpected validation errors
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error during validation'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  };
};

/**
 * Middleware to validate request body
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateBody = (schema: ZodSchema) => {
  return validateRequest(schema, 'body');
};

/**
 * Middleware to validate request parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateParams = (schema: ZodSchema) => {
  return validateRequest(schema, 'params');
};

/**
 * Middleware to validate request query parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateQuery = (schema: ZodSchema) => {
  return validateRequest(schema, 'query');
};
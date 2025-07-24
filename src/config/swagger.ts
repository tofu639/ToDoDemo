import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from './environment';

/**
 * Swagger/OpenAPI configuration for API documentation
 */

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Node.js TypeScript API Demo',
      version: '1.0.0',
      description: 'A comprehensive Node.js TypeScript backend API demo with JWT authentication, user management, and comprehensive documentation. This API demonstrates modern backend development practices with proper testing, validation, and containerization.',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint',
        },
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier',
              example: 'clp1234567890abcdef',
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe',
              minLength: 2,
              maxLength: 50,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
              example: '2023-12-01T10:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
              example: '2023-12-01T10:00:00.000Z',
            },
          },
          required: ['id', 'name', 'email', 'createdAt', 'updatedAt'],
        },
        
        // Request schemas
        UserRegistrationRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe',
              minLength: 2,
              maxLength: 50,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              description: 'User password (minimum 8 characters, must contain at least one lowercase letter, one uppercase letter, and one digit)',
              example: 'SecurePass123',
              minLength: 8,
              pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$',
            },
          },
          required: ['name', 'email', 'password'],
        },
        
        UserLoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'SecurePass123',
            },
          },
          required: ['email', 'password'],
        },
        
        UserUpdateRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe Updated',
              minLength: 2,
              maxLength: 50,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.updated@example.com',
            },
            password: {
              type: 'string',
              description: 'User password (minimum 8 characters, must contain at least one lowercase letter, one uppercase letter, and one digit)',
              example: 'NewSecurePass123',
              minLength: 8,
              pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$',
            },
          },
          additionalProperties: false,
        },
        
        // Response schemas
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbHAxMjM0NTY3ODkwYWJjZGVmIiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImlhdCI6MTcwMTQzMjAwMCwiZXhwIjoxNzAxNTE4NDAwfQ.example-signature',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
          required: ['token', 'user'],
        },
        
        // Standard response wrappers
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
              description: 'Indicates successful operation',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp',
              example: '2023-12-01T12:00:00.000Z',
            },
          },
          required: ['success', 'timestamp'],
        },
        
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
              description: 'Indicates failed operation',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code for programmatic handling',
                  example: 'USER_NOT_FOUND',
                },
                message: {
                  type: 'string',
                  description: 'Human-readable error message',
                  example: 'User with ID clp1234567890abcdef not found',
                },
                details: {
                  type: 'object',
                  description: 'Additional error details (optional)',
                  additionalProperties: true,
                },
              },
              required: ['code', 'message'],
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp',
              example: '2023-12-01T12:00:00.000Z',
            },
            path: {
              type: 'string',
              description: 'API endpoint path where error occurred',
              example: '/users/clp1234567890abcdef',
            },
          },
          required: ['success', 'error', 'timestamp', 'path'],
        },
        
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
              description: 'Indicates failed operation',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                  description: 'Error code for validation failures',
                },
                message: {
                  type: 'string',
                  example: 'Validation failed',
                  description: 'General validation error message',
                },
                details: {
                  type: 'array',
                  description: 'Detailed validation errors',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        description: 'Field that failed validation',
                        example: 'email',
                      },
                      message: {
                        type: 'string',
                        description: 'Validation error message for the field',
                        example: 'Invalid email format',
                      },
                    },
                    required: ['field', 'message'],
                  },
                },
              },
              required: ['code', 'message', 'details'],
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp',
              example: '2023-12-01T12:00:00.000Z',
            },
            path: {
              type: 'string',
              description: 'API endpoint path where error occurred',
              example: '/auth/register',
            },
          },
          required: ['success', 'error', 'timestamp', 'path'],
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check and API information endpoints',
      },
      {
        name: 'Authentication',
        description: 'User authentication endpoints (register, login)',
      },
      {
        name: 'Users',
        description: 'User management CRUD operations (requires authentication)',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/app.ts',
  ],
};

// Generate OpenAPI specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Setup Swagger UI middleware for Express app
 * @param app Express application instance
 */
export const setupSwagger = (app: Express): void => {
  // Swagger UI options
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6 }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 4px; }
    `,
    customSiteTitle: 'Node.js TypeScript API Demo - Documentation',
  };

  // Serve Swagger UI at /api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Serve raw OpenAPI JSON at /api-docs.json
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 Swagger UI available at http://localhost:${config.PORT}/api-docs`);
  console.log(`📄 OpenAPI JSON available at http://localhost:${config.PORT}/api-docs.json`);
};

export default swaggerSpec;
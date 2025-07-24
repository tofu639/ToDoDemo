import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation.middleware';
import { userRegistrationSchema, userLoginSchema } from '../utils/validation.schemas';

/**
 * Authentication routes configuration
 */
const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with name, email, and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistrationRequest'
 *           examples:
 *             example1:
 *               summary: Valid registration
 *               value:
 *                 name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 password: "SecurePass123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *                     message:
 *                       example: "User registered successfully"
 *             examples:
 *               success:
 *                 summary: Successful registration
 *                 value:
 *                   success: true
 *                   data:
 *                     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       id: "clp1234567890abcdef"
 *                       name: "John Doe"
 *                       email: "john.doe@example.com"
 *                       createdAt: "2023-12-01T10:00:00.000Z"
 *                       updatedAt: "2023-12-01T10:00:00.000Z"
 *                   message: "User registered successfully"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             examples:
 *               validation_error:
 *                 summary: Invalid input data
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION_ERROR"
 *                     message: "Validation failed"
 *                     details:
 *                       - field: "email"
 *                         message: "Invalid email format"
 *                       - field: "password"
 *                         message: "Password must contain at least one uppercase letter"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   path: "/auth/register"
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               user_exists:
 *                 summary: Email already registered
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "USER_ALREADY_EXISTS"
 *                     message: "User with this email already exists"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   path: "/auth/register"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/register',
  validateBody(userRegistrationSchema),
  authController.register.bind(authController)
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password, returns JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginRequest'
 *           examples:
 *             example1:
 *               summary: Valid login
 *               value:
 *                 email: "john.doe@example.com"
 *                 password: "SecurePass123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *                     message:
 *                       example: "Login successful"
 *             examples:
 *               success:
 *                 summary: Successful login
 *                 value:
 *                   success: true
 *                   data:
 *                     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       id: "clp1234567890abcdef"
 *                       name: "John Doe"
 *                       email: "john.doe@example.com"
 *                       createdAt: "2023-12-01T10:00:00.000Z"
 *                       updatedAt: "2023-12-01T10:00:00.000Z"
 *                   message: "Login successful"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_credentials:
 *                 summary: Wrong email or password
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "INVALID_CREDENTIALS"
 *                     message: "Invalid email or password"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   path: "/auth/login"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/login',
  validateBody(userLoginSchema),
  authController.login.bind(authController)
);

export default router;
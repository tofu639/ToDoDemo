import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { 
  userRegistrationSchema, 
  userUpdateSchema, 
  userIdSchema 
} from '../utils/validation.schemas';

/**
 * User routes configuration with proper middleware chain
 */
const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users (requires authentication)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "clp1234567890abcdef"
 *                       name: "John Doe"
 *                       email: "john.doe@example.com"
 *                       createdAt: "2023-12-01T10:00:00.000Z"
 *                       updatedAt: "2023-12-01T10:00:00.000Z"
 *                     - id: "clp0987654321fedcba"
 *                       name: "Jane Smith"
 *                       email: "jane.smith@example.com"
 *                       createdAt: "2023-12-01T11:00:00.000Z"
 *                       updatedAt: "2023-12-01T11:00:00.000Z"
 *                   timestamp: "2023-12-01T12:00:00.000Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/',
  authenticateToken,
  userController.getAllUsers.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID (requires authentication)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "clp1234567890abcdef"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "clp1234567890abcdef"
 *                     name: "John Doe"
 *                     email: "john.doe@example.com"
 *                     createdAt: "2023-12-01T10:00:00.000Z"
 *                     updatedAt: "2023-12-01T10:00:00.000Z"
 *                   timestamp: "2023-12-01T12:00:00.000Z"
 *       400:
 *         description: Invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_found:
 *                 summary: User not found
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "USER_NOT_FOUND"
 *                     message: "User with ID clp1234567890abcdef not found"
 *                   timestamp: "2023-12-01T12:00:00.000Z"
 *                   path: "/users/clp1234567890abcdef"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id',
  authenticateToken,
  validateParams(userIdSchema),
  userController.getUserById.bind(userController)
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user
 *     description: Create a new user (requires authentication)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistrationRequest'
 *           examples:
 *             example1:
 *               summary: Valid user creation
 *               value:
 *                 name: "Jane Smith"
 *                 email: "jane.smith@example.com"
 *                 password: "SecurePass456"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *                     message:
 *                       example: "User created successfully"
 *             examples:
 *               success:
 *                 summary: Successful creation
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "clp0987654321fedcba"
 *                     name: "Jane Smith"
 *                     email: "jane.smith@example.com"
 *                     createdAt: "2023-12-01T11:00:00.000Z"
 *                     updatedAt: "2023-12-01T11:00:00.000Z"
 *                   message: "User created successfully"
 *                   timestamp: "2023-12-01T12:00:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/',
  authenticateToken,
  validateBody(userRegistrationSchema),
  userController.createUser.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     description: Update a specific user's information (requires authentication)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "clp1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateRequest'
 *           examples:
 *             update_name:
 *               summary: Update name only
 *               value:
 *                 name: "John Doe Updated"
 *             update_email:
 *               summary: Update email only
 *               value:
 *                 email: "john.updated@example.com"
 *             update_all:
 *               summary: Update all fields
 *               value:
 *                 name: "John Doe Updated"
 *                 email: "john.updated@example.com"
 *                 password: "NewSecurePass123"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *                     message:
 *                       example: "User updated successfully"
 *             examples:
 *               success:
 *                 summary: Successful update
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "clp1234567890abcdef"
 *                     name: "John Doe Updated"
 *                     email: "john.updated@example.com"
 *                     createdAt: "2023-12-01T10:00:00.000Z"
 *                     updatedAt: "2023-12-01T12:30:00.000Z"
 *                   message: "User updated successfully"
 *                   timestamp: "2023-12-01T12:30:00.000Z"
 *       400:
 *         description: Validation error or invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  '/:id',
  authenticateToken,
  validateParams(userIdSchema),
  validateBody(userUpdateSchema),
  userController.updateUser.bind(userController)
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     description: Delete a specific user (requires authentication)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "clp1234567890abcdef"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "User deleted successfully"
 *             examples:
 *               success:
 *                 summary: Successful deletion
 *                 value:
 *                   success: true
 *                   message: "User deleted successfully"
 *                   timestamp: "2023-12-01T12:45:00.000Z"
 *       400:
 *         description: Invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  authenticateToken,
  validateParams(userIdSchema),
  userController.deleteUser.bind(userController)
);

export default router;
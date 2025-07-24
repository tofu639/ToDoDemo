import { Request, Response } from 'express';
import { userService, UserNotFoundError, UserAlreadyExistsError, UserServiceError } from '../services/user.service';
import { User } from '@prisma/client';

/**
 * User response type without password field
 */
type UserResponse = Omit<User, 'password'>;

/**
 * Helper function to exclude password from user object
 */
const excludePassword = (user: User): UserResponse => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Helper function to exclude password from array of users
 */
const excludePasswordFromUsers = (users: User[]): UserResponse[] => {
  return users.map(excludePassword);
};

/**
 * User controller class containing all CRUD endpoint handlers
 */
export class UserController {
  /**
   * GET /users - Get all users
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.findAll();
      const usersWithoutPassword = excludePasswordFromUsers(users);
      
      res.status(200).json({
        success: true,
        data: usersWithoutPassword,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof UserServiceError) {
        res.status(500).json({
          success: false,
          error: {
            code: 'USER_SERVICE_ERROR',
            message: error.message
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  }

  /**
   * GET /users/:id - Get user by ID
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_USER_ID',
            message: 'User ID is required'
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      const user = await userService.findById(id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: `User with ID ${id} not found`
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      const userWithoutPassword = excludePassword(user);
      
      res.status(200).json({
        success: true,
        data: userWithoutPassword,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof UserServiceError) {
        res.status(500).json({
          success: false,
          error: {
            code: 'USER_SERVICE_ERROR',
            message: error.message
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  }

  /**
   * POST /users - Create new user
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const user = await userService.createUser(userData);
      const userWithoutPassword = excludePassword(user);
      
      res.status(201).json({
        success: true,
        data: userWithoutPassword,
        message: 'User created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        res.status(409).json({
          success: false,
          error: {
            code: 'USER_ALREADY_EXISTS',
            message: error.message
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      if (error instanceof UserServiceError) {
        res.status(500).json({
          success: false,
          error: {
            code: 'USER_SERVICE_ERROR',
            message: error.message
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  }

  /**
   * PUT /users/:id - Update user by ID
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_USER_ID',
            message: 'User ID is required'
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      const updatedUser = await userService.updateUser(id, updateData);
      const userWithoutPassword = excludePassword(updatedUser);
      
      res.status(200).json({
        success: true,
        data: userWithoutPassword,
        message: 'User updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: error.message
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      if (error instanceof UserAlreadyExistsError) {
        res.status(409).json({
          success: false,
          error: {
            code: 'USER_ALREADY_EXISTS',
            message: error.message
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      if (error instanceof UserServiceError) {
        res.status(500).json({
          success: false,
          error: {
            code: 'USER_SERVICE_ERROR',
            message: error.message
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  }

  /**
   * DELETE /users/:id - Delete user by ID
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_USER_ID',
            message: 'User ID is required'
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      await userService.deleteUser(id);
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: error.message
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      if (error instanceof UserServiceError) {
        res.status(500).json({
          success: false,
          error: {
            code: 'USER_SERVICE_ERROR',
            message: error.message
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  }
}

// Export singleton instance
export const userController = new UserController();
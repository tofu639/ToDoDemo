import { Request, Response } from 'express';
import { authService, InvalidCredentialsError, AuthServiceError } from '../services/auth.service';
import { UserAlreadyExistsError } from '../services/user.service';

/**
 * Authentication controller class containing register and login endpoint handlers
 */
export class AuthController {
  /**
   * POST /auth/register - Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const registrationData = req.body;
      const authResponse = await authService.register(registrationData);
      
      res.status(201).json({
        success: true,
        data: authResponse,
        message: 'User registered successfully',
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
      
      if (error instanceof AuthServiceError) {
        res.status(500).json({
          success: false,
          error: {
            code: 'AUTH_SERVICE_ERROR',
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
   * POST /auth/login - Login user with email and password
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData = req.body;
      const authResponse = await authService.login(loginData);
      
      res.status(200).json({
        success: true,
        data: authResponse,
        message: 'Login successful',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: error.message
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      if (error instanceof AuthServiceError) {
        res.status(500).json({
          success: false,
          error: {
            code: 'AUTH_SERVICE_ERROR',
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
export const authController = new AuthController();
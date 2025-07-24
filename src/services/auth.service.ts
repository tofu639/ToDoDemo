import { User } from '@prisma/client';
import { userService, UserAlreadyExistsError } from './user.service';
import { PasswordUtil } from '../utils/password.util';
import { JWTUtil, JWTPayload } from '../utils/jwt.util';
import { UserRegistrationInput, UserLoginInput } from '../utils/validation.schemas';

/**
 * Authentication response interface
 */
export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

/**
 * Custom error classes for authentication service operations
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class AuthServiceError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

/**
 * Authentication service interface
 */
export interface IAuthService {
  register(data: UserRegistrationInput): Promise<AuthResponse>;
  login(data: UserLoginInput): Promise<AuthResponse>;
  validateToken(token: string): Promise<JWTPayload>;
}

/**
 * Authentication service implementation
 */
export class AuthService implements IAuthService {
  /**
   * Register a new user
   * @param data - User registration data
   * @returns Promise<AuthResponse> - Authentication response with token and user data
   * @throws UserAlreadyExistsError if email already exists
   * @throws AuthServiceError for other errors
   */
  async register(data: UserRegistrationInput): Promise<AuthResponse> {
    try {
      // Create user using user service (handles password hashing and duplicate checking)
      const user = await userService.createUser(data);

      // Generate JWT token
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
      };
      const token = JWTUtil.generateToken(payload);

      // Return response without password
      const { password, ...userWithoutPassword } = user;
      
      return {
        token,
        user: userWithoutPassword,
      };
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        throw error;
      }
      throw new AuthServiceError('Registration failed', error as Error);
    }
  }

  /**
   * Login user with email and password
   * @param data - Login credentials
   * @returns Promise<AuthResponse> - Authentication response with token and user data
   * @throws InvalidCredentialsError if credentials are invalid
   * @throws AuthServiceError for other errors
   */
  async login(data: UserLoginInput): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await userService.findByEmail(data.email);
      if (!user) {
        throw new InvalidCredentialsError();
      }

      // Verify password
      const isPasswordValid = await PasswordUtil.verifyPassword(data.password, user.password);
      if (!isPasswordValid) {
        throw new InvalidCredentialsError();
      }

      // Generate JWT token
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
      };
      const token = JWTUtil.generateToken(payload);

      // Return response without password
      const { password, ...userWithoutPassword } = user;
      
      return {
        token,
        user: userWithoutPassword,
      };
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw error;
      }
      throw new AuthServiceError('Login failed', error as Error);
    }
  }

  /**
   * Validate JWT token and return payload
   * @param token - JWT token to validate
   * @returns Promise<JWTPayload> - Decoded token payload
   * @throws AuthServiceError if token is invalid or expired
   */
  async validateToken(token: string): Promise<JWTPayload> {
    try {
      const payload = JWTUtil.verifyToken(token);
      
      // Optionally verify that the user still exists in the database
      const user = await userService.findById(payload.userId);
      if (!user) {
        throw new AuthServiceError('User no longer exists');
      }

      return payload;
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      throw new AuthServiceError('Token validation failed', error as Error);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
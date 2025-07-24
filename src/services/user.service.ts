import { User, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { PasswordUtil } from '../utils/password.util';
import { UserRegistrationInput, UserUpdateInput } from '../utils/validation.schemas';

/**
 * Custom error classes for user service operations
 */
export class UserNotFoundError extends Error {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
    this.name = 'UserNotFoundError';
  }
}

export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'UserAlreadyExistsError';
  }
}

export class UserServiceError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'UserServiceError';
  }
}

/**
 * User service interface defining all CRUD operations
 */
export interface IUserService {
  createUser(data: UserRegistrationInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updateUser(id: string, data: UserUpdateInput): Promise<User>;
  deleteUser(id: string): Promise<void>;
  findAll(): Promise<User[]>;
}

/**
 * User service implementation with business logic and error handling
 */
export class UserService implements IUserService {
  /**
   * Create a new user with hashed password
   * @param data - User registration data
   * @returns Promise<User> - Created user
   * @throws UserAlreadyExistsError if email already exists
   * @throws UserServiceError for other database errors
   */
  async createUser(data: UserRegistrationInput): Promise<User> {
    try {
      // Check if user with email already exists
      const existingUser = await this.findByEmail(data.email);
      if (existingUser) {
        throw new UserAlreadyExistsError(data.email);
      }

      // Hash the password before storing
      const hashedPassword = await PasswordUtil.hashPassword(data.password);

      // Create user in database
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        throw error;
      }

      // Handle Prisma unique constraint violation
      if ((error as any)?.code === 'P2002') {
        throw new UserAlreadyExistsError(data.email);
      }

      throw new UserServiceError('Failed to create user', error as Error);
    }
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns Promise<User | null> - User if found, null otherwise
   * @throws UserServiceError for database errors
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      return user;
    } catch (error) {
      throw new UserServiceError(`Failed to find user by ID: ${id}`, error as Error);
    }
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns Promise<User | null> - User if found, null otherwise
   * @throws UserServiceError for database errors
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      return user;
    } catch (error) {
      throw new UserServiceError(`Failed to find user by email: ${email}`, error as Error);
    }
  }

  /**
   * Update user information
   * @param id - User ID
   * @param data - Update data
   * @returns Promise<User> - Updated user
   * @throws UserNotFoundError if user doesn't exist
   * @throws UserAlreadyExistsError if email already exists for another user
   * @throws UserServiceError for other database errors
   */
  async updateUser(id: string, data: UserUpdateInput): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw new UserNotFoundError(id);
      }

      // If email is being updated, check for conflicts
      if (data.email && data.email !== existingUser.email) {
        const emailExists = await this.findByEmail(data.email);
        if (emailExists) {
          throw new UserAlreadyExistsError(data.email);
        }
      }

      // Prepare update data
      const updateData: Prisma.UserUpdateInput = {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
      };

      // Hash password if provided
      if (data.password) {
        updateData.password = await PasswordUtil.hashPassword(data.password);
      }

      // Update user in database
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof UserNotFoundError || error instanceof UserAlreadyExistsError) {
        throw error;
      }

      // Handle Prisma unique constraint violation
      if ((error as any)?.code === 'P2002') {
        throw new UserAlreadyExistsError(data.email || 'unknown');
      }

      // Handle Prisma record not found
      if ((error as any)?.code === 'P2025') {
        throw new UserNotFoundError(id);
      }

      throw new UserServiceError(`Failed to update user: ${id}`, error as Error);
    }
  }

  /**
   * Delete user by ID
   * @param id - User ID
   * @returns Promise<void>
   * @throws UserNotFoundError if user doesn't exist
   * @throws UserServiceError for database errors
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      // Handle Prisma record not found
      if ((error as any)?.code === 'P2025') {
        throw new UserNotFoundError(id);
      }

      throw new UserServiceError(`Failed to delete user: ${id}`, error as Error);
    }
  }

  /**
   * Get all users
   * @returns Promise<User[]> - Array of all users
   * @throws UserServiceError for database errors
   */
  async findAll(): Promise<User[]> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return users;
    } catch (error) {
      throw new UserServiceError('Failed to retrieve users', error as Error);
    }
  }
}

// Export singleton instance
export const userService = new UserService();
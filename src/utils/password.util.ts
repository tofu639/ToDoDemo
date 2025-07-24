import bcrypt from 'bcrypt';

/**
 * Password utility functions for hashing and verification
 */
export class PasswordUtil {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a plain text password
   * @param password - Plain text password to hash
   * @returns Promise<string> - Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a plain text password against a hashed password
   * @param password - Plain text password to verify
   * @param hashedPassword - Hashed password to compare against
   * @returns Promise<boolean> - True if password matches, false otherwise
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (!hashedPassword || typeof hashedPassword !== 'string') {
      throw new Error('Hashed password must be a non-empty string');
    }

    return bcrypt.compare(password, hashedPassword);
  }
}
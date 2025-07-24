import jwt, { SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms';

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface JWTOptions {
  expiresIn?: StringValue;
}

/**
 * JWT utility functions for token generation and validation
 */
export class JWTUtil {
  private static readonly DEFAULT_EXPIRES_IN = '24h';

  /**
   * Generate a JWT token
   * @param payload - Data to encode in the token
   * @param options - Token options (expiration, etc.)
   * @returns string - Generated JWT token
   */
  static generateToken(payload: JWTPayload, options?: JWTOptions): string {
    const secret = process.env['JWT_SECRET'];
    
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    if (!payload.userId || !payload.email) {
      throw new Error('Payload must contain userId and email');
    }

    const tokenOptions: SignOptions = {
      expiresIn: options?.expiresIn || this.DEFAULT_EXPIRES_IN,
    };

    return jwt.sign(payload, secret, tokenOptions);
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token to verify
   * @returns JWTPayload - Decoded token payload
   */
  static verifyToken(token: string): JWTPayload {
    const secret = process.env['JWT_SECRET'];
    
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string');
    }

    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;
      
      if (!decoded.userId || !decoded.email) {
        throw new Error('Invalid token payload');
      }

      return decoded;
    } catch (error) {
      // Check for TokenExpiredError first since it extends JsonWebTokenError
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Check if a token is expired without throwing an error
   * @param token - JWT token to check
   * @returns boolean - True if token is expired, false otherwise
   */
  static isTokenExpired(token: string): boolean {
    try {
      this.verifyToken(token);
      return false;
    } catch (error) {
      if (error instanceof Error && error.message === 'Token expired') {
        return true;
      }
      return false;
    }
  }
}
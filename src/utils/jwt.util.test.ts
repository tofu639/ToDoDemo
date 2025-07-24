import { JWTUtil, JWTPayload } from './jwt.util';
import jwt from 'jsonwebtoken';

// Mock environment variables
const originalEnv = process.env;

describe('JWTUtil', () => {
  const mockSecret = 'test-jwt-secret-key';
  const mockPayload: JWTPayload = {
    userId: 'user123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: mockSecret,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = JWTUtil.generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate token with custom expiration', () => {
      const token = JWTUtil.generateToken(mockPayload, { expiresIn: '1h' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should throw error when JWT_SECRET is missing', () => {
      delete process.env['JWT_SECRET'];

      expect(() => JWTUtil.generateToken(mockPayload)).toThrow(
        'JWT_SECRET environment variable is required'
      );
    });

    it('should throw error when userId is missing', () => {
      const invalidPayload = { userId: '', email: 'test@example.com' };

      expect(() => JWTUtil.generateToken(invalidPayload)).toThrow(
        'Payload must contain userId and email'
      );
    });

    it('should throw error when email is missing', () => {
      const invalidPayload = { userId: 'user123', email: '' };

      expect(() => JWTUtil.generateToken(invalidPayload)).toThrow(
        'Payload must contain userId and email'
      );
    });

    it('should generate different tokens for different payloads', () => {
      const payload1 = { userId: 'user1', email: 'user1@example.com' };
      const payload2 = { userId: 'user2', email: 'user2@example.com' };

      const token1 = JWTUtil.generateToken(payload1);
      const token2 = JWTUtil.generateToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = JWTUtil.generateToken(mockPayload);
      const decoded = JWTUtil.verifyToken(token);

      expect(decoded).toEqual(expect.objectContaining(mockPayload));
    });

    it('should throw error when JWT_SECRET is missing', () => {
      const token = JWTUtil.generateToken(mockPayload);
      delete process.env['JWT_SECRET'];

      expect(() => JWTUtil.verifyToken(token)).toThrow(
        'JWT_SECRET environment variable is required'
      );
    });

    it('should throw error for empty token', () => {
      expect(() => JWTUtil.verifyToken('')).toThrow(
        'Token must be a non-empty string'
      );
    });

    it('should throw error for null token', () => {
      expect(() => JWTUtil.verifyToken(null as any)).toThrow(
        'Token must be a non-empty string'
      );
    });

    it('should throw error for invalid token format', () => {
      expect(() => JWTUtil.verifyToken('invalid-token')).toThrow('Invalid token');
    });

    it('should throw error for expired token', (done) => {
      const expiredToken = jwt.sign(mockPayload, mockSecret, { expiresIn: '1ms' });
      
      // Wait a moment to ensure token is expired
      setTimeout(() => {
        expect(() => JWTUtil.verifyToken(expiredToken)).toThrow('Token expired');
        done();
      }, 10);
    });

    it('should throw error for token with wrong secret', () => {
      const tokenWithWrongSecret = jwt.sign(mockPayload, 'wrong-secret');

      expect(() => JWTUtil.verifyToken(tokenWithWrongSecret)).toThrow('Invalid token');
    });

    it('should throw error for token with invalid payload structure', () => {
      const invalidPayload = { userId: 'user123' }; // missing email
      const token = jwt.sign(invalidPayload, mockSecret);

      expect(() => JWTUtil.verifyToken(token)).toThrow('Invalid token payload');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = JWTUtil.generateToken(mockPayload);
      const isExpired = JWTUtil.isTokenExpired(token);

      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', (done) => {
      const expiredToken = jwt.sign(mockPayload, mockSecret, { expiresIn: '1ms' });
      
      // Wait a moment to ensure token is expired
      setTimeout(() => {
        const isExpired = JWTUtil.isTokenExpired(expiredToken);
        expect(isExpired).toBe(true);
        done();
      }, 10);
    });

    it('should return false for invalid token (not expired)', () => {
      const isExpired = JWTUtil.isTokenExpired('invalid-token');
      expect(isExpired).toBe(false);
    });

    it('should return false for empty token', () => {
      const isExpired = JWTUtil.isTokenExpired('');
      expect(isExpired).toBe(false);
    });
  });
});
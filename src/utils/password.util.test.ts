import { PasswordUtil } from './password.util';

describe('PasswordUtil', () => {
  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await PasswordUtil.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await PasswordUtil.hashPassword(password);
      const hash2 = await PasswordUtil.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for empty password', async () => {
      await expect(PasswordUtil.hashPassword('')).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should throw error for null password', async () => {
      await expect(PasswordUtil.hashPassword(null as any)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should throw error for undefined password', async () => {
      await expect(PasswordUtil.hashPassword(undefined as any)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should throw error for non-string password', async () => {
      await expect(PasswordUtil.hashPassword(123 as any)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await PasswordUtil.hashPassword(password);
      const isValid = await PasswordUtil.verifyPassword(password, hashedPassword);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword456';
      const hashedPassword = await PasswordUtil.hashPassword(password);
      const isValid = await PasswordUtil.verifyPassword(wrongPassword, hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const hashedPassword = await PasswordUtil.hashPassword('TestPassword123');
      
      await expect(PasswordUtil.verifyPassword('', hashedPassword)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should reject null password', async () => {
      const hashedPassword = await PasswordUtil.hashPassword('TestPassword123');
      
      await expect(PasswordUtil.verifyPassword(null as any, hashedPassword)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should reject empty hashed password', async () => {
      await expect(PasswordUtil.verifyPassword('TestPassword123', '')).rejects.toThrow(
        'Hashed password must be a non-empty string'
      );
    });

    it('should reject null hashed password', async () => {
      await expect(PasswordUtil.verifyPassword('TestPassword123', null as any)).rejects.toThrow(
        'Hashed password must be a non-empty string'
      );
    });

    it('should handle invalid hash format gracefully', async () => {
      const isValid = await PasswordUtil.verifyPassword('TestPassword123', 'invalid-hash');
      expect(isValid).toBe(false);
    });
  });
});
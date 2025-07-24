import {
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  userIdSchema,
} from './validation.schemas';

describe('Validation Schemas', () => {
  describe('userRegistrationSchema', () => {
    const validRegistrationData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'Password123',
    };

    it('should validate correct registration data', () => {
      const result = userRegistrationSchema.safeParse(validRegistrationData);
      expect(result.success).toBe(true);
    });

    it('should transform email to lowercase', () => {
      const dataWithUppercaseEmail = {
        ...validRegistrationData,
        email: 'JOHN.DOE@EXAMPLE.COM',
      };
      const result = userRegistrationSchema.safeParse(dataWithUppercaseEmail);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john.doe@example.com');
      }
    });

    it('should trim whitespace from name and email', () => {
      const dataWithWhitespace = {
        name: '  John Doe  ',
        email: '  john.doe@example.com  ',
        password: 'Password123',
      };
      const result = userRegistrationSchema.safeParse(dataWithWhitespace);
      
      if (!result.success) {
        console.log('Validation errors:', result.error.issues);
      }
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.email).toBe('john.doe@example.com');
      }
    });

    describe('name validation', () => {
      it('should reject name shorter than 2 characters', () => {
        const data = { ...validRegistrationData, name: 'J' };
        const result = userRegistrationSchema.safeParse(data);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Name must be at least 2 characters long');
        }
      });

      it('should reject name longer than 50 characters', () => {
        const data = { ...validRegistrationData, name: 'A'.repeat(51) };
        const result = userRegistrationSchema.safeParse(data);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Name must not exceed 50 characters');
        }
      });

      it('should accept name with exactly 2 characters', () => {
        const data = { ...validRegistrationData, name: 'Jo' };
        const result = userRegistrationSchema.safeParse(data);
        
        expect(result.success).toBe(true);
      });

      it('should accept name with exactly 50 characters', () => {
        const data = { ...validRegistrationData, name: 'A'.repeat(50) };
        const result = userRegistrationSchema.safeParse(data);
        
        expect(result.success).toBe(true);
      });
    });

    describe('email validation', () => {
      it('should reject invalid email format', () => {
        const data = { ...validRegistrationData, email: 'invalid-email' };
        const result = userRegistrationSchema.safeParse(data);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid email format');
        }
      });

      it('should accept valid email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
          'user123@test-domain.com',
        ];

        validEmails.forEach(email => {
          const data = { ...validRegistrationData, email };
          const result = userRegistrationSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('password validation', () => {
      it('should reject password shorter than 8 characters', () => {
        const data = { ...validRegistrationData, password: 'Pass1' };
        const result = userRegistrationSchema.safeParse(data);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Password must be at least 8 characters long');
        }
      });

      it('should reject password without lowercase letter', () => {
        const data = { ...validRegistrationData, password: 'PASSWORD123' };
        const result = userRegistrationSchema.safeParse(data);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('lowercase letter');
        }
      });

      it('should reject password without uppercase letter', () => {
        const data = { ...validRegistrationData, password: 'password123' };
        const result = userRegistrationSchema.safeParse(data);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('uppercase letter');
        }
      });

      it('should reject password without digit', () => {
        const data = { ...validRegistrationData, password: 'Password' };
        const result = userRegistrationSchema.safeParse(data);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('digit');
        }
      });

      it('should accept valid passwords', () => {
        const validPasswords = [
          'Password123',
          'MySecure1Pass',
          'Test123Password',
          'Abc123def',
        ];

        validPasswords.forEach(password => {
          const data = { ...validRegistrationData, password };
          const result = userRegistrationSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });
  });

  describe('userLoginSchema', () => {
    const validLoginData = {
      email: 'john.doe@example.com',
      password: 'anypassword',
    };

    it('should validate correct login data', () => {
      const result = userLoginSchema.safeParse(validLoginData);
      expect(result.success).toBe(true);
    });

    it('should transform email to lowercase', () => {
      const dataWithUppercaseEmail = {
        ...validLoginData,
        email: 'JOHN.DOE@EXAMPLE.COM',
      };
      const result = userLoginSchema.safeParse(dataWithUppercaseEmail);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john.doe@example.com');
      }
    });

    it('should reject invalid email format', () => {
      const data = { ...validLoginData, email: 'invalid-email' };
      const result = userLoginSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Invalid email format');
      }
    });

    it('should reject empty password', () => {
      const data = { ...validLoginData, password: '' };
      const result = userLoginSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Password is required');
      }
    });

    it('should accept any non-empty password (no complexity requirements for login)', () => {
      const passwords = ['simple', '123', 'a', 'very-long-password-without-requirements'];
      
      passwords.forEach(password => {
        const data = { ...validLoginData, password };
        const result = userLoginSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('userUpdateSchema', () => {
    it('should validate partial update with name only', () => {
      const data = { name: 'Updated Name' };
      const result = userUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate partial update with email only', () => {
      const data = { email: 'updated@example.com' };
      const result = userUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate partial update with password only', () => {
      const data = { password: 'NewPassword123' };
      const result = userUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate update with all fields', () => {
      const data = {
        name: 'Updated Name',
        email: 'updated@example.com',
        password: 'NewPassword123',
      };
      const result = userUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty update object', () => {
      const data = {};
      const result = userUpdateSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('At least one field must be provided for update');
      }
    });

    it('should apply same validation rules as registration for individual fields', () => {
      // Test name validation
      const invalidName = { name: 'A' };
      const nameResult = userUpdateSchema.safeParse(invalidName);
      expect(nameResult.success).toBe(false);

      // Test email validation
      const invalidEmail = { email: 'invalid-email' };
      const emailResult = userUpdateSchema.safeParse(invalidEmail);
      expect(emailResult.success).toBe(false);

      // Test password validation
      const invalidPassword = { password: 'weak' };
      const passwordResult = userUpdateSchema.safeParse(invalidPassword);
      expect(passwordResult.success).toBe(false);
    });
  });

  describe('userIdSchema', () => {
    it('should validate valid user ID', () => {
      const data = { id: 'user123' };
      const result = userIdSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should trim whitespace from ID', () => {
      const data = { id: '  user123  ' };
      const result = userIdSchema.safeParse(data);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('user123');
      }
    });

    it('should reject empty ID', () => {
      const data = { id: '' };
      const result = userIdSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('User ID is required');
      }
    });

    it('should reject ID with only whitespace', () => {
      const data = { id: '   ' };
      const result = userIdSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('User ID is required');
      }
    });
  });
});
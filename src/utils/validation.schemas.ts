import { z } from 'zod';

/**
 * Validation schemas using Zod for user registration, login, and updates
 */

// Password validation regex: at least 8 characters, one lowercase, one uppercase, one digit
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * User registration validation schema
 */
export const userRegistrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must not exceed 50 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      passwordRegex,
      'Password must contain at least one lowercase letter, one uppercase letter, and one digit'
    ),
});

/**
 * User login validation schema
 */
export const userLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

/**
 * User update validation schema (all fields optional)
 */
export const userUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must not exceed 50 characters')
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email format')
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      passwordRegex,
      'Password must contain at least one lowercase letter, one uppercase letter, and one digit'
    )
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update',
  }
);

/**
 * User ID parameter validation schema
 */
export const userIdSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'User ID is required'),
});

// Type exports for TypeScript
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserIdInput = z.infer<typeof userIdSchema>;
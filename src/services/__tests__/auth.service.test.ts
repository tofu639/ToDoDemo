import { User } from '@prisma/client';
import { AuthService, InvalidCredentialsError, AuthServiceError } from '../auth.service';
import { userService, UserAlreadyExistsError } from '../user.service';
import { PasswordUtil } from '../../utils/password.util';
import { JWTUtil } from '../../utils/jwt.util';
import { UserRegistrationInput, UserLoginInput } from '../../utils/validation.schemas';

// Mock dependencies
jest.mock('../user.service', () => ({
  userService: {
    createUser: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    findAll: jest.fn(),
  },
  UserAlreadyExistsError: jest.requireActual('../user.service').UserAlreadyExistsError,
}));
jest.mock('../../utils/password.util');
jest.mock('../../utils/jwt.util');

const mockUserService = userService as jest.Mocked<typeof userService>;
const mockPasswordUtil = PasswordUtil as jest.Mocked<typeof PasswordUtil>;
const mockJWTUtil = JWTUtil as jest.Mocked<typeof JWTUtil>;

describe('AuthService', () => {
  let authService: AuthService;
  
  const mockUser: User = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockUserWithoutPassword = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockToken = 'jwt-token-123';

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registrationData: UserRegistrationInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockJWTUtil.generateToken.mockReturnValue(mockToken);

      // Act
      const result = await authService.register(registrationData);

      // Assert
      expect(mockUserService.createUser).toHaveBeenCalledWith(registrationData);
      expect(mockJWTUtil.generateToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        token: mockToken,
        user: mockUserWithoutPassword,
      });
    });

    it('should throw UserAlreadyExistsError when email already exists', async () => {
      // Arrange
      const error = new UserAlreadyExistsError('john@example.com');
      mockUserService.createUser.mockRejectedValue(error);

      // Act
      const registerPromise = authService.register(registrationData);

      // Assert
      await expect(registerPromise).rejects.toThrow(UserAlreadyExistsError);
      expect(mockUserService.createUser).toHaveBeenCalledWith(registrationData);
      expect(mockJWTUtil.generateToken).not.toHaveBeenCalled();
    });

    it('should throw AuthServiceError for other registration errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockUserService.createUser.mockRejectedValue(error);

      // Act & Assert
      await expect(authService.register(registrationData)).rejects.toThrow(AuthServiceError);
      await expect(authService.register(registrationData)).rejects.toThrow('Registration failed');
      expect(mockUserService.createUser).toHaveBeenCalledWith(registrationData);
      expect(mockJWTUtil.generateToken).not.toHaveBeenCalled();
    });

    it('should throw AuthServiceError when JWT generation fails', async () => {
      // Arrange
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockJWTUtil.generateToken.mockImplementation(() => {
        throw new Error('JWT generation failed');
      });

      // Act & Assert
      await expect(authService.register(registrationData)).rejects.toThrow(AuthServiceError);
      expect(mockUserService.createUser).toHaveBeenCalledWith(registrationData);
      expect(mockJWTUtil.generateToken).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginData: UserLoginInput = {
      email: 'john@example.com',
      password: 'Password123',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordUtil.verifyPassword.mockResolvedValue(true);
      mockJWTUtil.generateToken.mockReturnValue(mockToken);

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockPasswordUtil.verifyPassword).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(mockJWTUtil.generateToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        token: mockToken,
        user: mockUserWithoutPassword,
      });
    });

    it('should throw InvalidCredentialsError when user not found', async () => {
      // Arrange
      mockUserService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(InvalidCredentialsError);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockPasswordUtil.verifyPassword).not.toHaveBeenCalled();
      expect(mockJWTUtil.generateToken).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsError when password is invalid', async () => {
      // Arrange
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordUtil.verifyPassword.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(InvalidCredentialsError);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockPasswordUtil.verifyPassword).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(mockJWTUtil.generateToken).not.toHaveBeenCalled();
    });

    it('should throw AuthServiceError when user service fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockUserService.findByEmail.mockRejectedValue(error);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(AuthServiceError);
      await expect(authService.login(loginData)).rejects.toThrow('Login failed');
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockPasswordUtil.verifyPassword).not.toHaveBeenCalled();
      expect(mockJWTUtil.generateToken).not.toHaveBeenCalled();
    });

    it('should throw AuthServiceError when password verification fails', async () => {
      // Arrange
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordUtil.verifyPassword.mockRejectedValue(new Error('Bcrypt error'));

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(AuthServiceError);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockPasswordUtil.verifyPassword).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(mockJWTUtil.generateToken).not.toHaveBeenCalled();
    });

    it('should throw AuthServiceError when JWT generation fails', async () => {
      // Arrange
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordUtil.verifyPassword.mockResolvedValue(true);
      mockJWTUtil.generateToken.mockImplementation(() => {
        throw new Error('JWT generation failed');
      });

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(AuthServiceError);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockPasswordUtil.verifyPassword).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(mockJWTUtil.generateToken).toHaveBeenCalled();
    });
  });

  describe('validateToken', () => {
    const mockPayload = {
      userId: 'user-123',
      email: 'john@example.com',
    };

    it('should successfully validate a valid token', async () => {
      // Arrange
      mockJWTUtil.verifyToken.mockReturnValue(mockPayload);
      mockUserService.findById.mockResolvedValue(mockUser);

      // Act
      const result = await authService.validateToken(mockToken);

      // Assert
      expect(mockJWTUtil.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockPayload.userId);
      expect(result).toEqual(mockPayload);
    });

    it('should throw AuthServiceError when token is invalid', async () => {
      // Arrange
      mockJWTUtil.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.validateToken(mockToken)).rejects.toThrow(AuthServiceError);
      await expect(authService.validateToken(mockToken)).rejects.toThrow('Token validation failed');
      expect(mockJWTUtil.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(mockUserService.findById).not.toHaveBeenCalled();
    });

    it('should throw AuthServiceError when user no longer exists', async () => {
      // Arrange
      mockJWTUtil.verifyToken.mockReturnValue(mockPayload);
      mockUserService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.validateToken(mockToken)).rejects.toThrow(AuthServiceError);
      await expect(authService.validateToken(mockToken)).rejects.toThrow('User no longer exists');
      expect(mockJWTUtil.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockPayload.userId);
    });

    it('should throw AuthServiceError when user service fails', async () => {
      // Arrange
      mockJWTUtil.verifyToken.mockReturnValue(mockPayload);
      mockUserService.findById.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(authService.validateToken(mockToken)).rejects.toThrow(AuthServiceError);
      expect(mockJWTUtil.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockPayload.userId);
    });

    it('should handle empty token', async () => {
      // Arrange
      mockJWTUtil.verifyToken.mockImplementation(() => {
        throw new Error('Token must be a non-empty string');
      });

      // Act & Assert
      await expect(authService.validateToken('')).rejects.toThrow(AuthServiceError);
      expect(mockJWTUtil.verifyToken).toHaveBeenCalledWith('');
      expect(mockUserService.findById).not.toHaveBeenCalled();
    });

    it('should handle token expiration', async () => {
      // Arrange
      mockJWTUtil.verifyToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act & Assert
      await expect(authService.validateToken(mockToken)).rejects.toThrow(AuthServiceError);
      await expect(authService.validateToken(mockToken)).rejects.toThrow('Token validation failed');
      expect(mockJWTUtil.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(mockUserService.findById).not.toHaveBeenCalled();
    });
  });
});
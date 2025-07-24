import { User } from '@prisma/client';
import { UserService, UserNotFoundError, UserAlreadyExistsError, UserServiceError } from '../user.service';
import { PasswordUtil } from '../../utils/password.util';
import { prisma } from '../../config/database';

// Mock Prisma client
jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock password utility
jest.mock('../../utils/password.util');

describe('UserService', () => {
  let userService: UserService;
  const mockPasswordUtil = PasswordUtil as jest.Mocked<typeof PasswordUtil>;
  const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;

  // Mock user data
  const mockUser: User = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  const mockUserRegistrationData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123',
  };

  const mockUserUpdateData = {
    name: 'Jane Doe',
    email: 'jane@example.com',
  };

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    beforeEach(() => {
      mockPasswordUtil.hashPassword.mockResolvedValue('hashedPassword123');
    });

    it('should create a new user successfully', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(null); // No existing user
      mockPrismaUser.create.mockResolvedValue(mockUser);

      // Act
      const result = await userService.createUser(mockUserRegistrationData);

      // Assert
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: mockUserRegistrationData.email },
      });
      expect(mockPasswordUtil.hashPassword).toHaveBeenCalledWith(mockUserRegistrationData.password);
      expect(mockPrismaUser.create).toHaveBeenCalledWith({
        data: {
          name: mockUserRegistrationData.name,
          email: mockUserRegistrationData.email,
          password: 'hashedPassword123',
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UserAlreadyExistsError when email already exists', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(mockUser); // Existing user

      // Act & Assert
      await expect(userService.createUser(mockUserRegistrationData))
        .rejects
        .toThrow(new UserAlreadyExistsError(mockUserRegistrationData.email));

      expect(mockPasswordUtil.hashPassword).not.toHaveBeenCalled();
      expect(mockPrismaUser.create).not.toHaveBeenCalled();
    });

    it('should throw UserAlreadyExistsError on Prisma unique constraint violation', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(null);
      const prismaError = new Error('Unique constraint violation') as any;
      prismaError.code = 'P2002';
      mockPrismaUser.create.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(userService.createUser(mockUserRegistrationData))
        .rejects
        .toThrow(new UserAlreadyExistsError(mockUserRegistrationData.email));
    });

    it('should throw UserServiceError on other database errors', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(null);
      const dbError = new Error('Database connection failed');
      mockPrismaUser.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userService.createUser(mockUserRegistrationData))
        .rejects
        .toThrow(new UserServiceError('Failed to create user', dbError));
    });

    it('should throw UserServiceError on password hashing failure', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(null);
      const hashError = new Error('Hashing failed');
      mockPasswordUtil.hashPassword.mockRejectedValue(hashError);

      // Act & Assert
      await expect(userService.createUser(mockUserRegistrationData))
        .rejects
        .toThrow(new UserServiceError('Failed to create user', hashError));
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await userService.findById('user-123');

      // Assert
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(null);

      // Act
      const result = await userService.findById('nonexistent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw UserServiceError on database error', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockPrismaUser.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userService.findById('user-123'))
        .rejects
        .toThrow(new UserServiceError('Failed to find user by ID: user-123', dbError));
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await userService.findByEmail('john@example.com');

      // Assert
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should convert email to lowercase before searching', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      // Act
      await userService.findByEmail('JOHN@EXAMPLE.COM');

      // Assert
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(null);

      // Act
      const result = await userService.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw UserServiceError on database error', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockPrismaUser.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userService.findByEmail('john@example.com'))
        .rejects
        .toThrow(new UserServiceError('Failed to find user by email: john@example.com', dbError));
    });
  });

  describe('updateUser', () => {
    const updatedUser = { ...mockUser, ...mockUserUpdateData };

    beforeEach(() => {
      mockPasswordUtil.hashPassword.mockResolvedValue('newHashedPassword123');
    });

    it('should update user successfully without password', async () => {
      // Arrange
      mockPrismaUser.findUnique
        .mockResolvedValueOnce(mockUser) // findById call
        .mockResolvedValueOnce(null); // findByEmail call for new email
      mockPrismaUser.update.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updateUser('user-123', mockUserUpdateData);

      // Assert
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          name: mockUserUpdateData.name,
          email: mockUserUpdateData.email,
        },
      });
      expect(result).toEqual(updatedUser);
      expect(mockPasswordUtil.hashPassword).not.toHaveBeenCalled();
    });

    it('should update user successfully with password', async () => {
      // Arrange
      const updateDataWithPassword = { ...mockUserUpdateData, password: 'NewPassword123' };
      mockPrismaUser.findUnique
        .mockResolvedValueOnce(mockUser) // findById call
        .mockResolvedValueOnce(null); // findByEmail call
      mockPrismaUser.update.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updateUser('user-123', updateDataWithPassword);

      // Assert
      expect(mockPasswordUtil.hashPassword).toHaveBeenCalledWith('NewPassword123');
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          name: mockUserUpdateData.name,
          email: mockUserUpdateData.email,
          password: 'newHashedPassword123',
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.updateUser('nonexistent-id', mockUserUpdateData))
        .rejects
        .toThrow(new UserNotFoundError('nonexistent-id'));

      expect(mockPrismaUser.update).not.toHaveBeenCalled();
    });

    it('should throw UserAlreadyExistsError when email already exists for another user', async () => {
      // Arrange
      const anotherUser = { ...mockUser, id: 'another-user-id' };
      mockPrismaUser.findUnique
        .mockResolvedValueOnce(mockUser) // findById call
        .mockResolvedValueOnce(anotherUser); // findByEmail call - email exists for another user

      // Act & Assert
      await expect(userService.updateUser('user-123', mockUserUpdateData))
        .rejects
        .toThrow(new UserAlreadyExistsError(mockUserUpdateData.email!));

      expect(mockPrismaUser.update).not.toHaveBeenCalled();
    });

    it('should not check email conflict when email is not being updated', async () => {
      // Arrange
      const updateDataWithoutEmail = { name: 'New Name' };
      mockPrismaUser.findUnique.mockResolvedValueOnce(mockUser); // findById call only
      mockPrismaUser.update.mockResolvedValue({ ...mockUser, name: 'New Name' });

      // Act
      await userService.updateUser('user-123', updateDataWithoutEmail);

      // Assert
      expect(mockPrismaUser.findUnique).toHaveBeenCalledTimes(1); // Only findById called
    });

    it('should allow updating to same email', async () => {
      // Arrange
      const updateDataWithSameEmail = { name: 'New Name', email: mockUser.email };
      mockPrismaUser.findUnique.mockResolvedValueOnce(mockUser); // findById call
      mockPrismaUser.update.mockResolvedValue({ ...mockUser, name: 'New Name' });

      // Act
      await userService.updateUser('user-123', updateDataWithSameEmail);

      // Assert
      expect(mockPrismaUser.findUnique).toHaveBeenCalledTimes(1); // Only findById called, no email check
      expect(mockPrismaUser.update).toHaveBeenCalled();
    });

    it('should throw UserServiceError on database error', async () => {
      // Arrange
      mockPrismaUser.findUnique.mockResolvedValueOnce(mockUser);
      const dbError = new Error('Database error');
      mockPrismaUser.update.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userService.updateUser('user-123', { name: 'New Name' }))
        .rejects
        .toThrow(new UserServiceError('Failed to update user: user-123', dbError));
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      mockPrismaUser.delete.mockResolvedValue(mockUser);

      // Act
      await userService.deleteUser('user-123');

      // Assert
      expect(mockPrismaUser.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      const prismaError = new Error('Record not found') as any;
      prismaError.code = 'P2025';
      mockPrismaUser.delete.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(userService.deleteUser('nonexistent-id'))
        .rejects
        .toThrow(new UserNotFoundError('nonexistent-id'));
    });

    it('should throw UserServiceError on other database errors', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockPrismaUser.delete.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userService.deleteUser('user-123'))
        .rejects
        .toThrow(new UserServiceError('Failed to delete user: user-123', dbError));
    });
  });

  describe('findAll', () => {
    const mockUsers = [mockUser, { ...mockUser, id: 'user-456', email: 'jane@example.com' }];

    it('should return all users ordered by creation date', async () => {
      // Arrange
      mockPrismaUser.findMany.mockResolvedValue(mockUsers);

      // Act
      const result = await userService.findAll();

      // Assert
      expect(mockPrismaUser.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      mockPrismaUser.findMany.mockResolvedValue([]);

      // Act
      const result = await userService.findAll();

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw UserServiceError on database error', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockPrismaUser.findMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userService.findAll())
        .rejects
        .toThrow(new UserServiceError('Failed to retrieve users', dbError));
    });
  });
});
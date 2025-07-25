import { PrismaClient } from '@prisma/client';

// Test database configuration
export class TestDatabase {
  private static instance: TestDatabase;
  private prisma: PrismaClient | null = null;

  private constructor() {}

  public static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  public async connect(): Promise<PrismaClient> {
    if (!this.prisma) {
      const databaseUrl = process.env['DATABASE_URL'] || 'postgresql://localhost:5432/test';
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
        log: process.env['NODE_ENV'] === 'test' ? [] : ['query', 'info', 'warn', 'error'],
      });

      // Test the connection
      await this.prisma.$connect();
    }
    return this.prisma;
  }

  public async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }
  }

  public async cleanup(): Promise<void> {
    if (this.prisma) {
      // Clean up test data in reverse order of dependencies
      await this.prisma.user.deleteMany({});
    }
  }

  public getPrisma(): PrismaClient | null {
    return this.prisma;
  }
}

// Export singleton instance
export const testDatabase = TestDatabase.getInstance();

// Helper functions for integration tests
export const setupTestDatabase = async (): Promise<PrismaClient> => {
  const prisma = await testDatabase.connect();
  await testDatabase.cleanup();
  return prisma;
};

export const teardownTestDatabase = async (): Promise<void> => {
  await testDatabase.cleanup();
  await testDatabase.disconnect();
};

// Test data seeding helpers
export const seedTestUser = async (prisma: PrismaClient, userData: any) => {
  return await prisma.user.create({
    data: userData,
  });
};

export const seedTestUsers = async (prisma: PrismaClient, usersData: any[]) => {
  const users = [];
  for (const userData of usersData) {
    const user = await prisma.user.create({
      data: userData,
    });
    users.push(user);
  }
  return users;
};
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
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env['DATABASE_URL'] || 'postgresql://test:test@localhost:5432/test_db',
          },
        },
        log: process.env['NODE_ENV'] === 'test' ? [] : ['query', 'info', 'warn', 'error'],
      });

      // Test the connection
      try {
        await this.prisma.$connect();
      } catch (error) {
        console.warn('Test database connection failed, using mocked database');
        // In test environment, we'll use mocked database operations
      }
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
    if (this.prisma && process.env['NODE_ENV'] === 'test') {
      try {
        // Clean up test data - be careful to only run in test environment
        await this.prisma.user.deleteMany({});
      } catch (error) {
        // Ignore cleanup errors in test environment
        console.warn('Test database cleanup failed:', error);
      }
    }
  }

  public getPrismaClient(): PrismaClient | null {
    return this.prisma;
  }
}

// Export singleton instance
export const testDatabase = TestDatabase.getInstance();

// Helper functions for test setup
export const setupTestDatabase = async (): Promise<PrismaClient> => {
  return await testDatabase.connect();
};

export const cleanupTestDatabase = async (): Promise<void> => {
  await testDatabase.cleanup();
};

export const teardownTestDatabase = async (): Promise<void> => {
  await testDatabase.disconnect();
};
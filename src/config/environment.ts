import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_ROUNDS: number;
  CORS_ORIGIN: string;
  SWAGGER_ENABLED: boolean;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  // Construct DATABASE_URL from components if available (Docker setup)
  // Otherwise use direct DATABASE_URL (development/test setup)
  let databaseUrl = process.env['DATABASE_URL'];
  
  if (!databaseUrl && process.env['DB_HOST']) {
    // Construct DATABASE_URL from individual components (Docker)
    const dbHost = process.env['DB_HOST'];
    const dbPort = process.env['DB_PORT'] || '5432';
    const dbName = process.env['DB_NAME'];
    const dbUser = process.env['DB_USER'];
    const dbPassword = process.env['DB_PASSWORD'];
    
    if (dbHost && dbName && dbUser && dbPassword) {
      databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public&sslmode=disable`;
    }
  }

  const requiredEnvVars = [
    'JWT_SECRET'
  ];

  // Check for required environment variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check for DATABASE_URL or components
  if (!databaseUrl) {
    throw new Error('Missing database configuration: Either DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD must be provided');
  }

  return {
    NODE_ENV: (process.env['NODE_ENV'] as 'development' | 'production' | 'test') || 'development',
    PORT: parseInt(process.env['PORT'] || '3000', 10),
    DATABASE_URL: databaseUrl,
    JWT_SECRET: process.env['JWT_SECRET']!,
    JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '24h',
    BCRYPT_ROUNDS: parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10),
    CORS_ORIGIN: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
    SWAGGER_ENABLED: process.env['SWAGGER_ENABLED'] === 'true'
  };
};

export const config = getEnvironmentConfig();
export default config;
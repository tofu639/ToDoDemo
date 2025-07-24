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
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET'
  ];

  // Check for required environment variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    NODE_ENV: (process.env['NODE_ENV'] as 'development' | 'production' | 'test') || 'development',
    PORT: parseInt(process.env['PORT'] || '3000', 10),
    DATABASE_URL: process.env['DATABASE_URL']!,
    JWT_SECRET: process.env['JWT_SECRET']!,
    JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '24h',
    BCRYPT_ROUNDS: parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10),
    CORS_ORIGIN: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
    SWAGGER_ENABLED: process.env['SWAGGER_ENABLED'] === 'true'
  };
};

export const config = getEnvironmentConfig();
export default config;
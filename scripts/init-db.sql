-- Database initialization script for Docker PostgreSQL container
-- This script runs when the PostgreSQL container starts for the first time

-- Create the main database if it doesn't exist
-- (This is handled by POSTGRES_DB environment variable, but kept for reference)

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create a healthcheck function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TEXT AS $$
BEGIN
    RETURN 'OK';
END;
$$ LANGUAGE plpgsql;
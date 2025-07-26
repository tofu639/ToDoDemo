#!/bin/bash

# Docker migration script
# This script runs database migrations in the Docker container

set -e

echo "🔄 Starting database migration..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until pg_isready -h postgres -p 5432 -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-nodejs_api_demo}; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🚀 Running database migrations..."
npx prisma migrate deploy

# Optional: Seed database (uncomment if you have seed data)
# echo "🌱 Seeding database..."
# npx prisma db seed

echo "✅ Database migration completed successfully!"
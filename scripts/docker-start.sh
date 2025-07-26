#!/bin/bash

# Docker startup script
# This script handles the complete application startup process in Docker

set -e

echo "🚀 Starting Node.js API application..."

# Function to wait for database
wait_for_database() {
    echo "⏳ Waiting for PostgreSQL database to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h postgres -p 5432 -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-nodejs_api_demo} >/dev/null 2>&1; then
            echo "✅ Database is ready!"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts: Database not ready, waiting 2 seconds..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ Database failed to become ready after $max_attempts attempts"
    exit 1
}

# Function to run migrations
run_migrations() {
    echo "🔧 Generating Prisma client..."
    npx prisma generate
    
    echo "🚀 Running database migrations..."
    npx prisma migrate deploy
    
    echo "✅ Database migrations completed!"
}

# Function to start application
start_application() {
    echo "🌟 Starting Node.js application..."
    exec npm start
}

# Main execution flow
main() {
    wait_for_database
    run_migrations
    start_application
}

# Handle signals for graceful shutdown
trap 'echo "🛑 Received shutdown signal, exiting..."; exit 0' SIGTERM SIGINT

# Run main function
main "$@"
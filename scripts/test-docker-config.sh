#!/bin/bash

# Docker Configuration Test Script
# This script validates the Docker setup without actually running containers

set -e

echo "🔍 Testing Docker configuration..."

# Check if required files exist
echo "📁 Checking required files..."

required_files=(
    "Dockerfile"
    "docker-compose.yml"
    ".env.docker.example"
    "scripts/docker-start.sh"
    "scripts/docker-migrate.sh"
    "scripts/init-db.sql"
    "prisma/schema.prisma"
    "package.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

# Check if scripts are executable
echo "🔧 Checking script permissions..."
if [ -x "scripts/docker-start.sh" ]; then
    echo "✅ docker-start.sh is executable"
else
    echo "⚠️  Making docker-start.sh executable..."
    chmod +x scripts/docker-start.sh
fi

if [ -x "scripts/docker-migrate.sh" ]; then
    echo "✅ docker-migrate.sh is executable"
else
    echo "⚠️  Making docker-migrate.sh executable..."
    chmod +x scripts/docker-migrate.sh
fi

# Validate Dockerfile syntax
echo "🐳 Validating Dockerfile..."
if command -v docker >/dev/null 2>&1; then
    if docker build --dry-run . >/dev/null 2>&1; then
        echo "✅ Dockerfile syntax is valid"
    else
        echo "❌ Dockerfile has syntax errors"
        exit 1
    fi
else
    echo "⚠️  Docker not available, skipping Dockerfile validation"
fi

# Validate docker-compose.yml syntax
echo "📋 Validating docker-compose.yml..."
if command -v docker-compose >/dev/null 2>&1; then
    if docker-compose config >/dev/null 2>&1; then
        echo "✅ docker-compose.yml syntax is valid"
    else
        echo "❌ docker-compose.yml has syntax errors"
        exit 1
    fi
else
    echo "⚠️  docker-compose not available, skipping validation"
fi

# Check environment variables
echo "🔐 Checking environment configuration..."
if [ -f ".env.docker" ]; then
    echo "✅ .env.docker exists"
    
    # Check for critical environment variables
    critical_vars=("JWT_SECRET" "POSTGRES_PASSWORD")
    for var in "${critical_vars[@]}"; do
        if grep -q "^${var}=" .env.docker; then
            value=$(grep "^${var}=" .env.docker | cut -d'=' -f2)
            if [[ "$value" == *"change"* ]] || [[ "$value" == *"default"* ]]; then
                echo "⚠️  $var should be changed from default value"
            else
                echo "✅ $var is configured"
            fi
        else
            echo "❌ $var is missing from .env.docker"
        fi
    done
else
    echo "⚠️  .env.docker not found, using .env.docker.example as reference"
fi

# Check package.json scripts
echo "📦 Checking package.json scripts..."
required_scripts=("build" "start" "prisma:generate" "prisma:migrate")
for script in "${required_scripts[@]}"; do
    if grep -q "\"$script\":" package.json; then
        echo "✅ npm script '$script' exists"
    else
        echo "❌ npm script '$script' is missing"
        exit 1
    fi
done

# Check Prisma schema
echo "🗄️  Checking Prisma configuration..."
if grep -q "provider.*postgresql" prisma/schema.prisma; then
    echo "✅ PostgreSQL provider configured in Prisma"
else
    echo "❌ PostgreSQL provider not found in Prisma schema"
    exit 1
fi

if grep -q "DATABASE_URL" prisma/schema.prisma; then
    echo "✅ DATABASE_URL environment variable referenced"
else
    echo "❌ DATABASE_URL not found in Prisma schema"
    exit 1
fi

echo ""
echo "🎉 Docker configuration validation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy .env.docker.example to .env.docker and update values"
echo "2. Run: docker-compose up -d"
echo "3. Test health endpoint: curl http://localhost:3000/health"
echo "4. View API docs: http://localhost:3000/api-docs"
echo ""
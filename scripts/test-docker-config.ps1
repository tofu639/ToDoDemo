# Docker Configuration Test Script (PowerShell)
# This script validates the Docker setup without actually running containers

Write-Host "Testing Docker configuration..." -ForegroundColor Cyan

# Check if required files exist
Write-Host "Checking required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "Dockerfile",
    "docker-compose.yml",
    ".env.docker.example",
    "scripts/docker-start.sh",
    "scripts/docker-migrate.sh",
    "scripts/init-db.sql",
    "prisma/schema.prisma",
    "package.json"
)

$allFilesExist = $true

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "OK: $file exists" -ForegroundColor Green
    } else {
        Write-Host "ERROR: $file is missing" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "ERROR: Some required files are missing" -ForegroundColor Red
    exit 1
}

# Check environment variables
Write-Host "Checking environment configuration..." -ForegroundColor Yellow

if (Test-Path ".env.docker") {
    Write-Host "OK: .env.docker exists" -ForegroundColor Green
    
    # Check for critical environment variables
    $criticalVars = @("JWT_SECRET", "POSTGRES_PASSWORD")
    $envContent = Get-Content ".env.docker"
    
    foreach ($var in $criticalVars) {
        $varLine = $envContent | Where-Object { $_ -match "^$var=" }
        if ($varLine) {
            $value = ($varLine -split "=", 2)[1]
            if ($value -match "change" -or $value -match "default") {
                Write-Host "WARNING: $var should be changed from default value" -ForegroundColor Yellow
            } else {
                Write-Host "OK: $var is configured" -ForegroundColor Green
            }
        } else {
            Write-Host "ERROR: $var is missing from .env.docker" -ForegroundColor Red
        }
    }
} else {
    Write-Host "WARNING: .env.docker not found, using .env.docker.example as reference" -ForegroundColor Yellow
}

# Check package.json scripts
Write-Host "Checking package.json scripts..." -ForegroundColor Yellow

$requiredScripts = @("build", "start", "prisma:generate", "prisma:migrate")
$packageJson = Get-Content "package.json" | ConvertFrom-Json

foreach ($script in $requiredScripts) {
    if ($packageJson.scripts.$script) {
        Write-Host "OK: npm script '$script' exists" -ForegroundColor Green
    } else {
        Write-Host "ERROR: npm script '$script' is missing" -ForegroundColor Red
        exit 1
    }
}

# Check Prisma schema
Write-Host "Checking Prisma configuration..." -ForegroundColor Yellow

$prismaContent = Get-Content "prisma/schema.prisma" -Raw

if ($prismaContent -match 'provider.*=.*"postgresql"') {
    Write-Host "OK: PostgreSQL provider configured in Prisma" -ForegroundColor Green
} else {
    Write-Host "ERROR: PostgreSQL provider not found in Prisma schema" -ForegroundColor Red
    exit 1
}

if ($prismaContent -match 'DATABASE_URL') {
    Write-Host "OK: DATABASE_URL environment variable referenced" -ForegroundColor Green
} else {
    Write-Host "ERROR: DATABASE_URL not found in Prisma schema" -ForegroundColor Red
    exit 1
}

# Check Docker availability
Write-Host "Checking Docker availability..." -ForegroundColor Yellow

try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "OK: Docker is available - $dockerVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "WARNING: Docker not available or not running" -ForegroundColor Yellow
}

try {
    $composeVersion = docker-compose --version 2>$null
    if ($composeVersion) {
        Write-Host "OK: Docker Compose is available - $composeVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "WARNING: Docker Compose not available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "SUCCESS: Docker configuration validation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy .env.docker.example to .env.docker and update values" -ForegroundColor White
Write-Host "2. Run: docker-compose up -d" -ForegroundColor White
Write-Host "3. Test health endpoint: curl http://localhost:3000/health" -ForegroundColor White
Write-Host "4. View API docs: http://localhost:3000/api-docs" -ForegroundColor White
Write-Host ""
# Docker Setup Guide

This guide explains how to run the Node.js API demo application using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.0 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

1. **Clone the repository and navigate to the project directory**

2. **Set up environment variables**
   ```bash
   cp .env.docker.example .env
   ```
   
   Edit the `.env` file and update the following critical values:
   - `POSTGRES_PASSWORD`: Change from default password
   - `JWT_SECRET`: Use a strong, unique secret key
   - Other configuration as needed

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Verify the application is running**
   ```bash
   # Check container status
   docker-compose ps
   
   # Check application health
   curl http://localhost:3000/health
   
   # View API documentation
   open http://localhost:3000/api-docs
   ```

## Services

### API Service
- **Container**: `nodejs-api-server`
- **Port**: 3000 (configurable via `API_PORT`)
- **Health Check**: `http://localhost:3000/health`
- **Documentation**: `http://localhost:3000/api-docs`

### PostgreSQL Database
- **Container**: `nodejs-api-postgres`
- **Port**: 5432 (configurable via `POSTGRES_PORT`)
- **Database**: `nodejs_api_demo` (configurable via `POSTGRES_DB`)
- **User**: `postgres` (configurable via `POSTGRES_USER`)

### Adminer (Optional)
- **Container**: `nodejs-api-adminer`
- **Port**: 8080 (configurable via `ADMINER_PORT`)
- **Access**: `http://localhost:8080`

To start with Adminer:
```bash
docker-compose --profile admin up -d
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Application environment |
| `PORT` | `3000` | Application port |
| `API_PORT` | `3000` | External API port mapping |
| `POSTGRES_DB` | `nodejs_api_demo` | Database name |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | `postgres_secure_password_change_me` | Database password |
| `POSTGRES_PORT` | `5432` | Database port mapping |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this-in-production-docker` | JWT signing secret |
| `JWT_EXPIRES_IN` | `24h` | JWT token expiration |
| `BCRYPT_ROUNDS` | `12` | Password hashing rounds |
| `CORS_ORIGIN` | `http://localhost:3000` | CORS allowed origin |
| `SWAGGER_ENABLED` | `true` | Enable API documentation |
| `ADMINER_PORT` | `8080` | Adminer port mapping |

## Docker Commands

### Development Commands

```bash
# Start all services
docker-compose up -d

# Start with logs
docker-compose up

# Start specific service
docker-compose up -d postgres

# View logs
docker-compose logs -f api
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This deletes database data)
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

### Database Management

```bash
# Run database migrations manually
docker-compose exec api npx prisma migrate deploy

# Generate Prisma client
docker-compose exec api npx prisma generate

# Access database directly
docker-compose exec postgres psql -U postgres -d nodejs_api_demo

# View database logs
docker-compose logs postgres
```

### Application Management

```bash
# View application logs
docker-compose logs -f api

# Execute commands in API container
docker-compose exec api npm run test

# Access container shell
docker-compose exec api sh

# Restart API service
docker-compose restart api
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if database is healthy
   docker-compose exec postgres pg_isready -U postgres -d nodejs_api_demo
   
   # Check database logs
   docker-compose logs postgres
   ```

2. **API Service Won't Start**
   ```bash
   # Check API logs
   docker-compose logs api
   
   # Verify environment variables
   docker-compose exec api env | grep -E "(DATABASE_URL|JWT_SECRET)"
   ```

3. **Port Already in Use**
   ```bash
   # Change ports in .env file
   API_PORT=3001
   POSTGRES_PORT=5433
   ADMINER_PORT=8081
   ```

4. **Permission Issues**
   ```bash
   # Fix script permissions
   chmod +x scripts/docker-start.sh scripts/docker-migrate.sh
   ```

### Health Checks

```bash
# API Health Check
curl http://localhost:3000/health

# Database Health Check
docker-compose exec postgres pg_isready -U postgres -d nodejs_api_demo

# Container Status
docker-compose ps
```

### Clean Reset

```bash
# Stop and remove everything
docker-compose down -v --remove-orphans

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## Production Considerations

1. **Security**
   - Change default passwords
   - Use strong JWT secrets
   - Configure proper CORS origins
   - Use environment-specific configurations

2. **Performance**
   - Adjust `BCRYPT_ROUNDS` based on server capacity
   - Configure database connection pooling
   - Set appropriate health check intervals

3. **Monitoring**
   - Monitor container logs
   - Set up log aggregation
   - Configure alerting for health check failures

4. **Backup**
   - Regular database backups
   - Volume backup strategies
   - Configuration backup

## API Testing

Once the application is running, you can test the API endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"SecurePass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123"}'

# Get users (requires authentication token)
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

For more detailed API documentation, visit `http://localhost:3000/api-docs` when the application is running.
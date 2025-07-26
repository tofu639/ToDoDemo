# Node.js TypeScript API Demo

A comprehensive Node.js TypeScript backend API demonstration featuring JWT authentication, user management, and modern development practices.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 👥 **User Management** - Complete CRUD operations for users
- 📚 **API Documentation** - Interactive Swagger UI documentation
- 🧪 **Comprehensive Testing** - Unit tests with Jest and high coverage
- 🐳 **Docker Support** - Containerized deployment with PostgreSQL
- 🔒 **Security** - Password hashing, input validation, and security headers
- 📝 **TypeScript** - Full TypeScript implementation with strict typing
- 🏗️ **Clean Architecture** - Layered architecture with separation of concerns

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nodejs-api-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL="postgresql://username:password@localhost:5432/nodejs_api_demo"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="24h"
   BCRYPT_ROUNDS=12
   CORS_ORIGIN="http://localhost:3000"
   SWAGGER_ENABLED=true
   ```

4. **Database setup**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## Docker Setup

For a complete containerized setup with PostgreSQL:

1. **Using Docker Compose**
   ```bash
   # Copy Docker environment file
   cp .env.docker.example .env.docker
   
   # Start all services
   npm run docker:up
   ```

2. **Access the application**
   - API: `http://localhost:3000`
   - Documentation: `http://localhost:3000/api-docs`
   - Health Check: `http://localhost:3000/health`

For detailed Docker setup instructions, see [Docker Setup Guide](docs/docker-setup.md).

## API Documentation

### Interactive Documentation
Visit `http://localhost:3000/api-docs` for interactive Swagger UI documentation.

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

#### User Management (Protected)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Health & Info
- `GET /health` - Health check
- `GET /` - API information

### Quick API Test

1. **Register a user**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Doe",
       "email": "john.doe@example.com",
       "password": "SecurePass123"
     }'
   ```

2. **Login and get token**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john.doe@example.com",
       "password": "SecurePass123"
     }'
   ```

3. **Use token to access protected endpoints**
   ```bash
   curl -X GET http://localhost:3000/api/users \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

For comprehensive API examples, see [API Examples](docs/api-examples.md).

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage
The project maintains high test coverage with comprehensive unit tests for:
- Authentication services
- User management services
- Middleware functions
- Utility functions
- API controllers

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run docker:up` - Start Docker containers
- `npm run docker:down` - Stop Docker containers

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # HTTP request handlers
├── middleware/      # Express middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
└── __tests__/       # Test files
```

## Postman Collection

Import the Postman collection for easy API testing:

1. **Import Collection**: `docs/nodejs-api-demo.postman_collection.json`
2. **Import Environment**: `docs/nodejs-api-demo.postman_environment.json`

The collection includes:
- Pre-configured requests for all endpoints
- Automatic token management
- Example responses
- Test scripts for validation

## Security Features

- **Password Hashing**: bcrypt with configurable salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Zod schemas for request validation
- **Security Headers**: Helmet.js for security headers
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Error Handling**: Secure error responses without sensitive data exposure

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT token expiration | `24h` |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:3000` |
| `SWAGGER_ENABLED` | Enable Swagger UI | `true` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support:
- Check the [API Examples](docs/api-examples.md) for usage examples
- Review the [Docker Setup Guide](docs/docker-setup.md) for deployment
- Open an issue for bugs or feature requests

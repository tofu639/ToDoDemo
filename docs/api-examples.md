# API Testing Examples

This document provides comprehensive examples for testing all API endpoints using curl commands and other tools.

## Base URL

- **Development**: `http://localhost:3000`
- **API Base Path**: `/api`
- **Documentation**: `http://localhost:3000/api-docs`

## Authentication Endpoints

### 1. Register User

Register a new user account.

**Endpoint**: `POST /api/auth/register`

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

**Expected Response (201)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clp1234567890abcdef",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z"
    }
  },
  "message": "User registered successfully",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

**Error Response (409 - User Already Exists)**:
```json
{
  "success": false,
  "error": {
    "code": "USER_ALREADY_EXISTS",
    "message": "User with this email already exists"
  },
  "timestamp": "2023-12-01T10:00:00.000Z",
  "path": "/auth/register"
}
```

### 2. Login User

Authenticate user with email and password.

**Endpoint**: `POST /api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clp1234567890abcdef",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z"
    }
  },
  "message": "Login successful",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

**Error Response (401 - Invalid Credentials)**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  },
  "timestamp": "2023-12-01T10:00:00.000Z",
  "path": "/auth/login"
}
```

## User Management Endpoints

**Note**: All user endpoints require authentication. Include the JWT token in the Authorization header.

### 3. Get All Users

Retrieve a list of all users.

**Endpoint**: `GET /api/users`

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clp1234567890abcdef",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z"
    },
    {
      "id": "clp0987654321fedcba",
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "createdAt": "2023-12-01T11:00:00.000Z",
      "updatedAt": "2023-12-01T11:00:00.000Z"
    }
  ],
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

### 4. Get User by ID

Retrieve a specific user by their ID.

**Endpoint**: `GET /api/users/:id`

```bash
curl -X GET http://localhost:3000/api/users/clp1234567890abcdef \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "clp1234567890abcdef",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z"
  },
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

**Error Response (404 - User Not Found)**:
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID clp1234567890abcdef not found"
  },
  "timestamp": "2023-12-01T12:00:00.000Z",
  "path": "/users/clp1234567890abcdef"
}
```

### 5. Create New User

Create a new user (requires authentication).

**Endpoint**: `POST /api/users`

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "password": "SecurePass456"
  }'
```

**Expected Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "clp0987654321fedcba",
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "createdAt": "2023-12-01T11:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z"
  },
  "message": "User created successfully",
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

### 6. Update User

Update a specific user's information.

**Endpoint**: `PUT /api/users/:id`

```bash
# Update name only
curl -X PUT http://localhost:3000/api/users/clp1234567890abcdef \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "John Doe Updated"
  }'

# Update email only
curl -X PUT http://localhost:3000/api/users/clp1234567890abcdef \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "email": "john.updated@example.com"
  }'

# Update all fields
curl -X PUT http://localhost:3000/api/users/clp1234567890abcdef \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "John Doe Updated",
    "email": "john.updated@example.com",
    "password": "NewSecurePass123"
  }'
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "clp1234567890abcdef",
    "name": "John Doe Updated",
    "email": "john.updated@example.com",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T12:30:00.000Z"
  },
  "message": "User updated successfully",
  "timestamp": "2023-12-01T12:30:00.000Z"
}
```

### 7. Delete User

Delete a specific user.

**Endpoint**: `DELETE /api/users/:id`

```bash
curl -X DELETE http://localhost:3000/api/users/clp1234567890abcdef \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "User deleted successfully",
  "timestamp": "2023-12-01T12:45:00.000Z"
}
```

## Health Check Endpoints

### 8. Health Check

Check if the API server is running and healthy.

**Endpoint**: `GET /health`

```bash
curl -X GET http://localhost:3000/health
```

**Expected Response (200)**:
```json
{
  "status": "OK",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "environment": "development",
  "database": {
    "status": "connected"
  }
}
```

### 9. API Information

Get basic information about the API.

**Endpoint**: `GET /`

```bash
curl -X GET http://localhost:3000/
```

**Expected Response (200)**:
```json
{
  "message": "Node.js TypeScript API Demo",
  "version": "1.0.0",
  "environment": "development",
  "documentation": "http://localhost:3000/api-docs"
}
```

## Common Error Responses

### Authentication Errors

**401 Unauthorized - Missing Token**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access token is required"
  },
  "timestamp": "2023-12-01T12:00:00.000Z",
  "path": "/users"
}
```

**401 Unauthorized - Invalid Token**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  },
  "timestamp": "2023-12-01T12:00:00.000Z",
  "path": "/users"
}
```

### Validation Errors

**400 Bad Request - Validation Error**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must contain at least one uppercase letter"
      }
    ]
  },
  "timestamp": "2023-12-01T10:00:00.000Z",
  "path": "/auth/register"
}
```

## Testing Workflow Example

Here's a complete workflow example for testing the API:

```bash
# 1. Register a new user
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123"
  }')

# 2. Extract token from response (requires jq)
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.token')

# 3. Get all users
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"

# 4. Create another user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Another User",
    "email": "another@example.com",
    "password": "AnotherPass123"
  }'

# 5. Login with the original user
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }')

echo "Login successful: $LOGIN_RESPONSE"
```

## Notes

- Replace `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` with actual JWT tokens from login/register responses
- Replace user IDs like `clp1234567890abcdef` with actual user IDs from your responses
- All timestamps are in ISO 8601 format
- Password requirements: minimum 8 characters with at least one uppercase letter, one lowercase letter, and one number
- Email must be in valid email format
- User names must be between 2-50 characters
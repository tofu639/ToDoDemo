# Swagger API Documentation Usage Guide

## Overview

The Node.js TypeScript API Demo includes comprehensive API documentation using Swagger/OpenAPI 3.0. This documentation provides interactive testing capabilities and detailed information about all available endpoints.

## Accessing the Documentation

### Swagger UI (Interactive Documentation)
- **URL**: `http://localhost:3000/api-docs`
- **Description**: Interactive web interface for exploring and testing the API
- **Features**:
  - Browse all available endpoints
  - View request/response schemas
  - Test endpoints directly from the browser
  - Authentication support with JWT tokens

### OpenAPI JSON Specification
- **URL**: `http://localhost:3000/api-docs.json`
- **Description**: Raw OpenAPI 3.0 specification in JSON format
- **Use Cases**:
  - Import into API testing tools (Postman, Insomnia)
  - Generate client SDKs
  - Integrate with CI/CD pipelines

## Using the Interactive Documentation

### 1. Authentication
Most endpoints require JWT authentication. To test protected endpoints:

1. First, register a new user or login using the authentication endpoints:
   - `POST /api/auth/register` - Create a new account
   - `POST /api/auth/login` - Login with existing credentials

2. Copy the JWT token from the response

3. Click the "Authorize" button at the top of the Swagger UI

4. Enter the token in the format: `Bearer <your-jwt-token>`

5. Click "Authorize" to apply the token to all requests

### 2. Testing Endpoints

#### Authentication Endpoints
- **Register**: `POST /api/auth/register`
  - Create a new user account
  - Required fields: name, email, password
  - Returns JWT token and user information

- **Login**: `POST /api/auth/login`
  - Authenticate with existing credentials
  - Required fields: email, password
  - Returns JWT token and user information

#### User Management Endpoints (Requires Authentication)
- **Get All Users**: `GET /api/users`
  - Retrieve list of all users
  - No request body required

- **Get User by ID**: `GET /api/users/{id}`
  - Retrieve specific user by ID
  - Replace `{id}` with actual user ID

- **Create User**: `POST /api/users`
  - Create a new user (admin function)
  - Required fields: name, email, password

- **Update User**: `PUT /api/users/{id}`
  - Update existing user information
  - Optional fields: name, email, password

- **Delete User**: `DELETE /api/users/{id}`
  - Remove user from system
  - Replace `{id}` with actual user ID

### 3. Understanding Response Formats

#### Success Responses
All successful responses follow this format:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful", // optional
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

#### Error Responses
All error responses follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* additional error details */ } // optional
  },
  "timestamp": "2023-12-01T12:00:00.000Z",
  "path": "/api/endpoint/path"
}
```

#### Validation Error Responses
Validation errors include detailed field-level information:
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
  "timestamp": "2023-12-01T12:00:00.000Z",
  "path": "/api/auth/register"
}
```

## Example Workflow

### 1. Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

### 2. Login and Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

### 3. Use Token for Protected Endpoints
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Schema Validation

The API uses Zod for input validation with the following rules:

### User Registration/Creation
- **name**: 2-50 characters, required
- **email**: Valid email format, required
- **password**: Minimum 8 characters, must contain:
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one digit

### User Updates
- All fields are optional
- Same validation rules apply when fields are provided
- At least one field must be provided

## Error Codes

Common error codes you might encounter:

- `VALIDATION_ERROR`: Input validation failed
- `USER_ALREADY_EXISTS`: Email already registered
- `INVALID_CREDENTIALS`: Wrong email or password
- `USER_NOT_FOUND`: User ID doesn't exist
- `UNAUTHORIZED`: Missing or invalid JWT token
- `SERVER_ERROR`: Internal server error

## Tips for Testing

1. **Use the "Try it out" feature** in Swagger UI for interactive testing
2. **Check the Examples** provided in each endpoint documentation
3. **Copy curl commands** from Swagger UI for command-line testing
4. **Export to Postman** using the OpenAPI JSON specification
5. **Test error scenarios** by providing invalid data to understand error responses

## Development Notes

- The documentation is automatically generated from JSDoc comments in the route files
- Schema definitions are based on the Zod validation schemas
- All endpoints include comprehensive examples and error scenarios
- The documentation is available in both development and production environments